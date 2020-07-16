# blairnangle.github.io

Personal website. Hosted on GitHub Pages with AWS Route 53 custom domain resolution.

## Prerequisites

* [node](https://nodejs.org/en/download/) (tested with 14.4.0 and [npm](https://www.npmjs.com/package/npm) 6.14.6)
* [gatsby-cli](https://www.npmjs.com/package/gatsby-cli) (tested with 2.11.0)

## Local Development

To serve the site at `localhost:8000`:

```bash
$ gatsby develop
```

Or, for a custom port with more detailed output:

```bash
$ gatsby develop --port 1990 --verbose
```

## Deploying and Hosting

The site is hosted on GitHub Pages as a *user* site, meaning public files must be served from `master`. From
[this page](https://docs.github.com/en/github/working-with-github-pages/about-github-pages#publishing-sources-for-github-pages-sites)
on the GitHub docs:

> The default publishing source for user and organization sites is the master branch. If the repository for your user or
> organization site has a master branch, your site will publish automatically from that branch. You cannot choose a
> different publishing source for user or organization sites.

With this in mind, changes are committed and pushed to `dev` and the
[Gatsby Publish Action](https://github.com/marketplace/actions/gatsby-publish) is used to build public site assets and
commit changes to `master` to allow the site to be served from GitHub Pages.

### Custom Domain

The site is served at https://blairnangle.com using a `CNAME` record in this project and appropriate Route 53
configuration in AWS (see [blairnangle-dot-com-route-53](https://github.com/blairnangle/blairnangle-dot-com-route-53)).
