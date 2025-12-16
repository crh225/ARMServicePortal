import * as React from 'react'

const IndexPage = () => {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Welcome to ${{ values.site_name }}</h1>
      <p>${{ values.description }}</p>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Next Steps</h2>
        <ol>
          <li>Replace this with your actual Gatsby blog content</li>
          <li>Copy your existing blog files from <code>C:\Users\Chris\Development\blog</code></li>
          <li>If you have a Mario game, place it in <code>static/mario/</code></li>
          <li>Push to main branch to deploy</li>
        </ol>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Useful Links</h2>
        <ul>
          <li><a href="https://www.gatsbyjs.com/docs">Gatsby Documentation</a></li>
          <li><a href="https://argocd.chrishouse.io">ArgoCD (Deployment Status)</a></li>
          <li><a href="https://backstage.chrishouse.io">Backstage (Service Catalog)</a></li>
        </ul>
      </div>
    </main>
  )
}

export default IndexPage

export const Head = () => <title>${{ values.site_name }}</title>
