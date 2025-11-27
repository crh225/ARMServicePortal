import React from "react";
import "../../styles/Footer.css";

function Footer() {
  return (
    <footer className="app-footer">
      <span>built by: chouse</span>
      <span className="footer-links">
        <a href="https://argocd.chrishouse.io" target="_blank" rel="noopener noreferrer">ArgoCD</a>
        {" | "}
        <a href="https://es-test-az-elk-managed-dev-5a6e80.kb.eastus2.azure.elastic-cloud.com:9243" target="_blank" rel="noopener noreferrer">Kibana</a>
      </span>
    </footer>
  );
}

export default Footer;
