import React from "react";
import "../../styles/ComponentSelector.css";

/**
 * Building blocks component definitions with icons and metadata
 */
const COMPONENTS = {
  postgres: {
    id: "postgres",
    name: "PostgreSQL",
    description: "Relational database",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
    color: "#336791",
    enabledField: "postgres_enabled"
  },
  redis: {
    id: "redis",
    name: "Redis",
    description: "In-memory cache",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
    color: "#dc382d",
    enabledField: "redis_enabled"
  },
  rabbitmq: {
    id: "rabbitmq",
    name: "RabbitMQ",
    description: "Message queue",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg",
    color: "#ff6600",
    enabledField: "rabbitmq_enabled"
  },
  backend: {
    id: "backend",
    name: "Backend",
    description: "API service",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    color: "#339933",
    enabledField: "backend_enabled"
  },
  frontend: {
    id: "frontend",
    name: "Frontend",
    description: "Web UI",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    color: "#61dafb",
    enabledField: "frontend_enabled"
  },
  ingress: {
    id: "ingress",
    name: "Ingress",
    description: "External access",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg",
    color: "#009639",
    enabledField: "ingress_enabled"
  }
};

const COMPONENT_ORDER = ["postgres", "redis", "rabbitmq", "backend", "frontend", "ingress"];

/**
 * ComponentSelector - Card-based selector for building blocks components
 */
function ComponentSelector({ formValues, onChange }) {
  const handleToggle = (componentId) => {
    const component = COMPONENTS[componentId];
    const currentValue = formValues[component.enabledField];
    const isEnabled = currentValue === true || currentValue === "true";
    onChange(component.enabledField, !isEnabled);
  };

  return (
    <div className="component-selector">
      <div className="component-selector__header">
        <h3 className="component-selector__title">Select Components</h3>
        <p className="component-selector__help">
          Click to enable or disable components for your application
        </p>
      </div>

      <div className="component-selector__grid">
        {COMPONENT_ORDER.map((componentId) => {
          const component = COMPONENTS[componentId];
          const isEnabled = formValues[component.enabledField] === true ||
                           formValues[component.enabledField] === "true";

          return (
            <button
              key={component.id}
              type="button"
              className={`component-card ${isEnabled ? "component-card--selected" : ""}`}
              onClick={() => handleToggle(component.id)}
              style={{
                "--component-color": component.color,
                "--component-color-light": `${component.color}15`
              }}
            >
              <div className="component-card__icon-wrapper">
                <img
                  src={component.icon}
                  alt={component.name}
                  className="component-card__icon"
                />
              </div>
              <div className="component-card__content">
                <span className="component-card__name">{component.name}</span>
                <span className="component-card__description">{component.description}</span>
              </div>
              <div className="component-card__checkbox">
                {isEnabled ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="component-card__check">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : (
                  <div className="component-card__unchecked" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary of selected components */}
      <div className="component-selector__summary">
        {COMPONENT_ORDER.filter(id => {
          const component = COMPONENTS[id];
          return formValues[component.enabledField] === true ||
                 formValues[component.enabledField] === "true";
        }).length === 0 ? (
          <span className="component-selector__empty">No components selected</span>
        ) : (
          <span className="component-selector__count">
            {COMPONENT_ORDER.filter(id => {
              const component = COMPONENTS[id];
              return formValues[component.enabledField] === true ||
                     formValues[component.enabledField] === "true";
            }).length} component(s) selected
          </span>
        )}
      </div>
    </div>
  );
}

export default ComponentSelector;
