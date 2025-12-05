import { useEffect, useState } from 'react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import CircularProgress from '@material-ui/core/CircularProgress';
import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';

interface ResourceGroup {
  name: string;
  location?: string;
  environment?: string;
}

// Normalize resource group data - API may return strings or objects
const normalizeResourceGroups = (data: unknown): ResourceGroup[] => {
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') {
        return { name: item };
      }
      return item as ResourceGroup;
    });
  }
  return [];
};

export const AzureResourceGroupPickerComponent = ({
  onChange,
  rawErrors,
  required,
  formData,
  uiSchema,
  schema,
}: FieldExtensionComponentProps<string>) => {
  const configApi = useApi(configApiRef);
  const [resourceGroups, setResourceGroups] = useState<ResourceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const environment = uiSchema?.['ui:options']?.environment as string | undefined;
  const title = schema.title || 'Resource Group';
  const description = schema.description;

  useEffect(() => {
    const fetchResourceGroups = async () => {
      try {
        setLoading(true);
        const backendUrl = configApi.getString('backend.baseUrl');
        const queryParams = environment ? `?environment=${environment}` : '';

        const response = await fetch(
          `${backendUrl}/api/proxy/arm-portal/api/resources/resource-groups${queryParams}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch resource groups: ${response.statusText}`);
        }

        const data = await response.json();
        // Normalize the data - API returns { resourceGroups: string[] }
        const rawGroups = data.resourceGroups || data || [];
        setResourceGroups(normalizeResourceGroups(rawGroups));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resource groups');
        setResourceGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResourceGroups();
  }, [configApi, environment]);

  if (loading) {
    return (
      <FormControl fullWidth margin="normal">
        <InputLabel>{title}</InputLabel>
        <CircularProgress size={24} style={{ margin: '10px auto' }} />
      </FormControl>
    );
  }

  return (
    <FormControl
      fullWidth
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 || !!error}
    >
      <InputLabel>{title}</InputLabel>
      <Select
        value={formData || ''}
        onChange={e => onChange(e.target.value as string)}
        disabled={loading || !!error}
      >
        {resourceGroups.map(rg => (
          <MenuItem key={rg.name} value={rg.name}>
            {rg.name}{rg.location ? ` (${rg.location})` : ''}
          </MenuItem>
        ))}
      </Select>
      {description && <FormHelperText>{description}</FormHelperText>}
      {error && <FormHelperText error>{error}</FormHelperText>}
      {rawErrors?.length > 0 && (
        <FormHelperText error>{rawErrors.join(', ')}</FormHelperText>
      )}
    </FormControl>
  );
};
