import { useEffect, useState } from 'react';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';

interface ImageOption {
  repository: string;
  tag: string;
  fullImage: string;
}

interface RepositoryResponse {
  name: string;
  fullPath: string;
}

export const ContainerImagePickerComponent = ({
  onChange,
  rawErrors,
  required,
  formData,
  schema,
}: FieldExtensionComponentProps<string>) => {
  const configApi = useApi(configApiRef);
  const { fetch } = useApi(fetchApiRef);
  const [repositories, setRepositories] = useState<RepositoryResponse[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTags, setLoadingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = schema.title || 'Container Image';
  const description = schema.description;

  // Fetch repositories on mount
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true);
        const backendUrl = configApi.getString('backend.baseUrl');

        const response = await fetch(
          `${backendUrl}/api/proxy/arm-portal/api/registry/repositories`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.statusText}`);
        }

        const data = await response.json();
        const repos = data.repositories || data || [];
        // Normalize to RepositoryResponse format - handle both string[] and object[] responses
        const normalizedRepos: RepositoryResponse[] = repos.map((repo: string | RepositoryResponse) => {
          if (typeof repo === 'string') {
            return { name: repo, fullPath: repo };
          }
          return repo;
        });
        setRepositories(normalizedRepos);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repositories');
        setRepositories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [configApi, fetch]);

  // Fetch tags when repository changes
  useEffect(() => {
    if (!selectedRepo) {
      setTags([]);
      return;
    }

    const fetchTags = async () => {
      try {
        setLoadingTags(true);
        const backendUrl = configApi.getString('backend.baseUrl');
        const encodedRepo = encodeURIComponent(selectedRepo);

        const response = await fetch(
          `${backendUrl}/api/proxy/arm-portal/api/registry/repositories/${encodedRepo}/tags`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.statusText}`);
        }

        const data = await response.json();
        setTags(data.tags || data || []);
      } catch (err) {
        setTags([]);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, [configApi, fetch, selectedRepo]);

  // Build image options from selected repo and tags
  const imageOptions: ImageOption[] = tags.map(tag => ({
    repository: selectedRepo,
    tag,
    fullImage: `${selectedRepo}:${tag}`,
  }));

  if (loading) {
    return (
      <FormControl fullWidth margin="normal">
        <InputLabel>{title}</InputLabel>
        <CircularProgress size={24} style={{ margin: '10px auto' }} />
      </FormControl>
    );
  }

  return (
    <div style={{ marginTop: '16px', marginBottom: '8px' }}>
      <FormControl
        fullWidth
        margin="normal"
        error={rawErrors?.length > 0 || !!error}
      >
        <InputLabel>Repository</InputLabel>
        <Select
          value={selectedRepo}
          onChange={e => {
            setSelectedRepo(e.target.value as string);
            onChange(''); // Clear selected image when repo changes
          }}
        >
          {repositories.map(repo => (
            <MenuItem key={repo.fullPath} value={repo.fullPath}>
              {repo.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedRepo && (
        <FormControl
          fullWidth
          margin="normal"
          required={required}
          error={rawErrors?.length > 0}
        >
          {loadingTags ? (
            <CircularProgress size={24} style={{ margin: '10px auto' }} />
          ) : (
            <Autocomplete
              options={imageOptions}
              getOptionLabel={option => option.fullImage}
              value={imageOptions.find(opt => opt.fullImage === formData) || null}
              onChange={(_, newValue) => {
                onChange(newValue?.fullImage || '');
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label={title}
                  required={required}
                  helperText={description}
                />
              )}
            />
          )}
        </FormControl>
      )}

      {error && <FormHelperText error>{error}</FormHelperText>}
      {rawErrors?.length > 0 && (
        <FormHelperText error>{rawErrors.join(', ')}</FormHelperText>
      )}
    </div>
  );
};
