import { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import SearchIcon from '@material-ui/icons/Search';
import { Content, Header, Page } from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
import { CustomTemplateCard } from './CustomTemplateCard';

const useStyles = makeStyles((theme) => ({
  searchContainer: {
    marginBottom: 24,
  },
  searchField: {
    width: '100%',
    maxWidth: 400,
    '& .MuiOutlinedInput-root': {
      borderRadius: 8,
      backgroundColor: '#ffffff',
    },
  },
  grid: {
    marginTop: 8,
  },
  noResults: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
  },
}));

export const CustomScaffolderPage = () => {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const [templates, setTemplates] = useState<TemplateEntityV1beta3[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await catalogApi.getEntities({
          filter: { kind: 'Template' },
        });
        setTemplates(response.items as TemplateEntityV1beta3[]);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [catalogApi]);

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = template.metadata.title?.toLowerCase() || '';
    const description = template.metadata.description?.toLowerCase() || '';
    const tags = template.metadata.tags?.join(' ').toLowerCase() || '';
    return title.includes(query) || description.includes(query) || tags.includes(query);
  });

  return (
    <Page themeId="tool">
      <Header
        title="Create a new component"
        subtitle="Create new software components using standard templates in your organization"
      />
      <Content>
        <div className={classes.searchContainer}>
          <TextField
            className={classes.searchField}
            variant="outlined"
            size="small"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
        </div>

        {loading ? (
          <div className={classes.noResults}>Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className={classes.noResults}>
            {searchQuery ? 'No templates match your search' : 'No templates available'}
          </div>
        ) : (
          <Grid container spacing={3} className={classes.grid}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={template.metadata.uid}>
                <CustomTemplateCard template={template} />
              </Grid>
            ))}
          </Grid>
        )}
      </Content>
    </Page>
  );
};
