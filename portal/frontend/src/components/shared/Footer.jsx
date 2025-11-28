import React from "react";
import "../../styles/Footer.css";

function Footer() {
  return (
    <footer className="app-footer">
      <span className="footer-credit">&lt; chouse /&gt;</span>
      <span className="footer-links">
        {/* ArgoCD - brand color: #EF7B4D (orange) */}
        <a href="https://argocd.chrishouse.io" target="_blank" rel="noopener noreferrer" title="ArgoCD" className="footer-icon footer-icon--argo">
          <img
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/argocd/argocd-original.svg"
            alt="ArgoCD"
            width="20"
            height="20"
            className="footer-icon-img"
          />
        </a>
        {/* Elastic/Kibana - brand color: #FEC514 (yellow) */}
        <a href="https://es-test-az-elk-managed-dev-5a6e80.kb.eastus2.azure.elastic-cloud.com:9243" target="_blank" rel="noopener noreferrer" title="Kibana" className="footer-icon footer-icon--kibana">
          <img
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kibana/kibana-original.svg"
            alt="Kibana"
            width="20"
            height="20"
            className="footer-icon-img"
          />
        </a>
        {/* LinkedIn - brand color: #0A66C2 (blue) */}
        <a href="https://www.linkedin.com/in/1chrishouse/" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="footer-icon footer-icon--linkedin">
          <img
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
            alt="LinkedIn"
            width="20"
            height="20"
            className="footer-icon-img"
          />
        </a>
        {/* Mario - Cyber Mario blog (cyberpunk colors) */}
        <a href="https://blog.chrishouse.io/cyber-mario/" target="_blank" rel="noopener noreferrer" title="Cyber Mario" className="footer-icon footer-icon--mario">
          <svg
            width="20"
            height="20"
            viewBox="0 0 128 128"
            className="footer-icon-img"
          >
            {/* Cap - hot pink */}
            <path fill="#FF10F0" d="M52 8h24v8H52zM44 16h48v8H44zM36 24h64v8H36zM36 32h64v8H36z"/>
            {/* Face/skin - pale cyber */}
            <path fill="#E0D4FF" d="M28 40h24v8H28zM28 48h24v8H28zM76 40h24v8H76zM76 48h24v8H76z"/>
            {/* Hair/mustache - dark purple */}
            <path fill="#2D1B4E" d="M52 40h24v8H52zM44 48h8v8h-8zM68 48h8v8h-8z"/>
            {/* Face continued */}
            <path fill="#E0D4FF" d="M52 48h16v8H52zM36 56h56v8H36zM28 64h72v8H28z"/>
            {/* Eyes - neon cyan */}
            <path fill="#00F0FF" d="M44 56h8v8h-8zM68 56h8v8h-8z"/>
            {/* Shirt - hot pink */}
            <path fill="#FF10F0" d="M36 72h24v8H36zM68 72h24v8H68zM28 80h32v8H28zM68 80h32v8H68z"/>
            {/* Overalls - neon cyan */}
            <path fill="#00F0FF" d="M60 72h8v8h-8zM52 80h24v8H52zM44 88h40v8H44z"/>
            {/* Hands - pale cyber */}
            <path fill="#E0D4FF" d="M28 88h16v8H28zM84 88h16v8H84z"/>
            {/* Shoes - dark purple */}
            <path fill="#2D1B4E" d="M20 96h24v8H20zM84 96h24v8H84zM20 104h24v8H20zM84 104h24v8H84z"/>
          </svg>
        </a>
        {/* Hacker Blog - Retro CRT monitor */}
        <a href="https://blog.chrishouse.io" target="_blank" rel="noopener noreferrer" title="Hacker Blog" className="footer-icon footer-icon--hacker">
          <svg width="20" height="20" viewBox="0 0 24 24" className="footer-icon-img">
            <rect x="2" y="2" width="20" height="15" rx="2" fill="#2d2d2d" stroke="#00ff41" strokeWidth="1"/>
            <rect x="4" y="4" width="16" height="11" fill="#0a0a0a"/>
            <text x="5" y="9" fill="#00ff41" fontSize="4" fontFamily="monospace">HACK</text>
            <text x="5" y="13" fill="#00ff41" fontSize="4" fontFamily="monospace">&gt;_</text>
            <rect x="8" y="17" width="8" height="2" fill="#2d2d2d"/>
            <rect x="6" y="19" width="12" height="2" fill="#2d2d2d"/>
            <line x1="18" y1="5" x2="18" y2="5.5" stroke="#ff0000" strokeWidth="1"/>
          </svg>
        </a>
      </span>
    </footer>
  );
}

export default Footer;
