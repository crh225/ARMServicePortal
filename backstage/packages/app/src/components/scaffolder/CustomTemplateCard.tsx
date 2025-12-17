import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles(() => ({
  card: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#ffffff',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: '#2563eb',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)',
      transform: 'translateY(-2px)',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '20px 20px 12px',
  },
  iconContainer: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    flexShrink: 0,
    '& img': {
      width: 28,
      height: 28,
    },
    '& svg': {
      width: 28,
      height: 28,
    },
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#0f172a',
    margin: 0,
    marginBottom: 4,
    lineHeight: 1.3,
  },
  type: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  content: {
    padding: '0 20px 16px',
    flex: 1,
  },
  description: {
    fontSize: '0.875rem',
    color: '#6b7280',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    margin: 0,
  },
  tags: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    height: 24,
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    color: '#475569',
  },
  actions: {
    padding: '12px 20px 16px',
    borderTop: '1px solid rgba(148, 163, 184, 0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  owner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  ownerIcon: {
    width: 16,
    height: 16,
    opacity: 0.7,
  },
  chooseButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: 8,
    textTransform: 'none',
    fontWeight: 500,
    padding: '6px 16px',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: '#1d4ed8',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
    },
  },
}));

// Azure service icons mapping
const serviceIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  'azure-container-app': {
    icon: 'https://raw.githubusercontent.com/Azure/azure-icons/main/icons/Container%20Apps.svg',
    color: '#0078d4',
    bgColor: 'rgba(0, 120, 212, 0.1)',
  },
  'azure-container-instance': {
    icon: 'https://raw.githubusercontent.com/Azure/azure-icons/main/icons/Container%20Instances.svg',
    color: '#0078d4',
    bgColor: 'rgba(0, 120, 212, 0.1)',
  },
  'azure-function': {
    icon: 'https://raw.githubusercontent.com/Azure/azure-icons/main/icons/Function%20Apps.svg',
    color: '#0062ad',
    bgColor: 'rgba(0, 98, 173, 0.1)',
  },
  'azure-key-vault-basic': {
    icon: 'https://raw.githubusercontent.com/Azure/azure-icons/main/icons/Key%20Vaults.svg',
    color: '#0078d4',
    bgColor: 'rgba(0, 120, 212, 0.1)',
  },
  'azure-storage-basic': {
    icon: 'https://raw.githubusercontent.com/Azure/azure-icons/main/icons/Storage%20Accounts.svg',
    color: '#0078d4',
    bgColor: 'rgba(0, 120, 212, 0.1)',
  },
  'azure-rg-basic': {
    icon: 'https://raw.githubusercontent.com/Azure/azure-icons/main/icons/Resource%20Groups.svg',
    color: '#0078d4',
    bgColor: 'rgba(0, 120, 212, 0.1)',
  },
  'azure-postgres-flexible': {
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    color: '#336791',
    bgColor: 'rgba(51, 103, 145, 0.1)',
  },
  'xp-building-blocks': {
    icon: 'https://raw.githubusercontent.com/cncf/artwork/main/projects/crossplane/icon/color/crossplane-icon-color.svg',
    color: '#6C4DC4',
    bgColor: 'rgba(108, 77, 196, 0.1)',
  },
  'microservice-node': {
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    color: '#339933',
    bgColor: 'rgba(51, 153, 51, 0.1)',
  },
  'static-site-gatsby': {
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gatsby/gatsby-original.svg',
    color: '#663399',
    bgColor: 'rgba(102, 51, 153, 0.1)',
  },
  'decommission-microservice': {
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    color: '#339933',
    bgColor: 'rgba(51, 153, 51, 0.1)',
  },
  'node-app': {
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    color: '#339933',
    bgColor: 'rgba(51, 153, 51, 0.1)',
  },
  'promote-microservice': {
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    color: '#339933',
    bgColor: 'rgba(51, 153, 51, 0.1)',
  },
  // Crossplane templates - use Crossplane logo
  'xp-storage-account': {
    icon: 'https://raw.githubusercontent.com/cncf/artwork/main/projects/crossplane/icon/color/crossplane-icon-color.svg',
    color: '#6C4DC4',
    bgColor: 'rgba(108, 77, 196, 0.1)',
  },
  'xp-resource-group': {
    icon: 'https://raw.githubusercontent.com/cncf/artwork/main/projects/crossplane/icon/color/crossplane-icon-color.svg',
    color: '#6C4DC4',
    bgColor: 'rgba(108, 77, 196, 0.1)',
  },
};

// Default icon for unknown templates
const defaultIcon = {
  icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
  color: '#0078d4',
  bgColor: 'rgba(0, 120, 212, 0.1)',
};

interface CustomTemplateCardProps {
  template: TemplateEntityV1beta3;
}

export const CustomTemplateCard = ({ template }: CustomTemplateCardProps) => {
  const classes = useStyles();
  const navigate = useNavigate();

  const templateName = template.metadata.name;
  const title = template.metadata.title || templateName;
  const description = template.metadata.description || '';
  const tags = template.metadata.tags || [];
  const owner = template.spec.owner || 'unknown';
  const type = template.spec.type || 'service';

  const iconConfig = serviceIcons[templateName] || defaultIcon;

  const handleChoose = () => {
    navigate(`/create/templates/default/${templateName}`);
  };

  return (
    <Card className={classes.card} elevation={0}>
      <div className={classes.header}>
        <div
          className={classes.iconContainer}
          style={{ backgroundColor: iconConfig.bgColor }}
        >
          <img
            src={iconConfig.icon}
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultIcon.icon;
            }}
          />
        </div>
        <div className={classes.headerContent}>
          <h3 className={classes.title}>{title}</h3>
          <span className={classes.type}>{type}</span>
        </div>
      </div>

      <CardContent className={classes.content}>
        <p className={classes.description}>{description}</p>
        {tags.length > 0 && (
          <div className={classes.tags}>
            {tags.slice(0, 4).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                className={classes.tag}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardActions className={classes.actions}>
        <span className={classes.owner}>
          <svg className={classes.ownerIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          {owner}
        </span>
        <Button
          variant="contained"
          className={classes.chooseButton}
          onClick={handleChoose}
        >
          Choose
        </Button>
      </CardActions>
    </Card>
  );
};
