import { useReducer, useEffect } from "react";
import api from "../services/api";
import { parseTerraformVariables, initializeFormValues, parsePolicyErrors } from "../utils/terraformParser";

/**
 * Initial state for blueprint management
 */
const initialState = {
  blueprints: [],
  selectedBlueprint: null,
  formValues: {},
  result: null,
  error: null,
  loading: false,
  moduleName: null,
  policyErrors: null
};

/**
 * Action types
 */
const ACTIONS = {
  SET_BLUEPRINTS: 'SET_BLUEPRINTS',
  SELECT_BLUEPRINT: 'SELECT_BLUEPRINT',
  UPDATE_FORM_VALUE: 'UPDATE_FORM_VALUE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_POLICY_ERRORS: 'SET_POLICY_ERRORS',
  SET_RESULT: 'SET_RESULT',
  LOAD_UPDATE_DATA: 'LOAD_UPDATE_DATA',
  CLEAR_FEEDBACK: 'CLEAR_FEEDBACK'
};

/**
 * Reducer for blueprint state management
 */
function blueprintReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_BLUEPRINTS:
      return { ...state, blueprints: action.payload };

    case ACTIONS.SELECT_BLUEPRINT:
      return {
        ...state,
        selectedBlueprint: action.payload.blueprint,
        formValues: action.payload.formValues,
        result: null,
        error: null,
        moduleName: null,
        policyErrors: null
      };

    case ACTIONS.UPDATE_FORM_VALUE:
      return {
        ...state,
        formValues: { ...state.formValues, [action.payload.name]: action.payload.value }
      };

    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
        policyErrors: action.payload.policyErrors,
        loading: false
      };

    case ACTIONS.SET_POLICY_ERRORS:
      return { ...state, policyErrors: action.payload };

    case ACTIONS.SET_RESULT:
      return {
        ...state,
        result: action.payload,
        selectedBlueprint: null,
        formValues: {},
        moduleName: null,
        loading: false,
        error: null,
        policyErrors: null
      };

    case ACTIONS.LOAD_UPDATE_DATA:
      return {
        ...state,
        selectedBlueprint: action.payload.blueprint,
        formValues: action.payload.formValues,
        moduleName: action.payload.moduleName,
        result: null,
        error: null,
        policyErrors: null
      };

    case ACTIONS.CLEAR_FEEDBACK:
      return {
        ...state,
        result: null,
        error: null,
        policyErrors: null
      };

    default:
      return state;
  }
}

/**
 * Custom hook for managing blueprint state and operations
 */
export function useBlueprints(updateResourceData, onClearUpdate) {
  const [state, dispatch] = useReducer(blueprintReducer, initialState);

  // Load blueprints on mount
  useEffect(() => {
    const loadBlueprints = async () => {
      try {
        const data = await api.fetchBlueprints();
        dispatch({ type: ACTIONS.SET_BLUEPRINTS, payload: data });
      } catch (err) {
        console.error(err);
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: "Failed to load blueprints", policyErrors: null }
        });
      }
    };
    loadBlueprints();
  }, []);

  // Handle update resource data
  useEffect(() => {
    if (updateResourceData && state.blueprints.length > 0) {
      const blueprintId = updateResourceData.blueprintId;
      if (blueprintId) {
        const bp = state.blueprints.find((b) => b.id === blueprintId);
        if (bp) {
          const parsedVars = parseTerraformVariables(updateResourceData.terraformModule);

          dispatch({
            type: ACTIONS.LOAD_UPDATE_DATA,
            payload: {
              blueprint: bp,
              formValues: parsedVars,
              moduleName: updateResourceData.moduleName
            }
          });
        }
      }
    }
  }, [updateResourceData, state.blueprints]);

  // Handle blueprint selection
  const handleSelectBlueprint = (id) => {
    // Allow null to deselect
    const bp = id ? state.blueprints.find((b) => b.id === id) || null : null;
    const formValues = bp ? initializeFormValues(bp) : {};

    dispatch({
      type: ACTIONS.SELECT_BLUEPRINT,
      payload: { blueprint: bp, formValues }
    });

    // Clear update resource data when user manually selects a blueprint
    if (onClearUpdate) {
      onClearUpdate();
    }
  };

  // Handle form field changes
  const handleFormChange = (name, value) => {
    dispatch({
      type: ACTIONS.UPDATE_FORM_VALUE,
      payload: { name, value }
    });
  };

  // Submit provision request
  const handleSubmit = async () => {
    if (!state.selectedBlueprint) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.CLEAR_FEEDBACK });

    try {
      const data = await api.provisionBlueprint(
        state.selectedBlueprint.id,
        state.formValues,
        state.moduleName
      );

      if (data.error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            error: data.error,
            policyErrors: data.policyErrors || null
          }
        });
      } else {
        dispatch({
          type: ACTIONS.SET_RESULT,
          payload: {
            status: data.status,
            pullRequestUrl: data.pullRequestUrl,
            branchName: data.branchName,
            filePath: data.filePath,
            policyWarnings: data.policyWarnings
          }
        });

        // Clear update resource data so they can start fresh
        if (onClearUpdate) {
          onClearUpdate();
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.message || "Failed to submit request";
      const policyErrors = parsePolicyErrors(errorMessage);

      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: { error: errorMessage, policyErrors }
      });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  return {
    blueprints: state.blueprints,
    selectedBlueprint: state.selectedBlueprint,
    formValues: state.formValues,
    result: state.result,
    error: state.error,
    loading: state.loading,
    policyErrors: state.policyErrors,
    handleSelectBlueprint,
    handleFormChange,
    handleSubmit
  };
}
