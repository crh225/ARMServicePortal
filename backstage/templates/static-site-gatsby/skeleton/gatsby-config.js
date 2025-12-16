module.exports = {
  siteMetadata: {
    title: '${{ values.site_name }}',
    description: '${{ values.description }}',
    siteUrl: 'https://${{ values.domain }}',
    author: '${{ values.owner }}',
  },
  plugins: [
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `posts`,
        path: `${__dirname}/content/posts`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    // Uncomment gatsby-plugin-manifest after adding icon.png to src/images/
    // {
    //   resolve: `gatsby-plugin-manifest`,
    //   options: {
    //     name: '${{ values.site_name }}',
    //     short_name: '${{ values.site_name }}',
    //     start_url: `/`,
    //     background_color: `#000000`,
    //     theme_color: `#00ff7f`,
    //     display: `standalone`,
    //     icon: `src/images/icon.png`,
    //   },
    // },
    // Uncomment gatsby-plugin-offline after enabling manifest
    // {
    //   resolve: `gatsby-plugin-offline`,
    //   options: {
    //     workboxConfig: {
    //       skipWaiting: true,
    //       clientsClaim: true,
    //     },
    //   },
    // },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              classPrefix: "language-",
            },
          },
        ],
      },
    },
    `gatsby-plugin-react-helmet`,
  ],
}
