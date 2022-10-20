[![New Relic One Catalog Project header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/New_Relic_One_Catalog_Project.png)](https://opensource.newrelic.com/oss-category/#new-relic-one-catalog-project)


# Labs Widget Pack

![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/newrelic/nr-labs-widget-pack?include_prereleases&sort=semver) 


A collection of custom visualizations to enhance your dashboarding experience.
- Multi Line Compare
- Radar Chart w/ChartJS
- Nerdlet Loader

---

## Multi Line Compare

![Screenshot #1](screenshots/multiline_01.png)

## Radar Chart

![Screenshot #1](screenshots/radar_01.png)



- Allow for multi timeseries line comparisons with correctly referenced times

## Nerdlet Loader

- Allows loading other nerdlets within the frame

Example settings.
```
Nerdlet ID: service-maps.home

URL State: {"entityGuid":"MTYwNjg2MnxBUE18QVBQTElDQVRJT058NjI2OTA3NjE"}

```

## Open source license

This project is distributed under the [Apache 2 license](LICENSE).


## Deploying this Nerdpack

As this pack of visualizations is available via the New Relic Catalog, go to New Relic IO and search for "Labs Widget Pack", click the icon and subscribe this to your relevant accounts.

Once subscribed you can browse to Apps -> Custom Visualizations to add to your dashboard.


## Manual Deployment

Open a command prompt in the app's directory and run the following commands.


```bash
# Typically you will need to regenerate the uuid for the account to which you're deploying this app, use the following command
nr1 nerdpack:uuid -gf [--profile=your_profile_name]
# to see a list of APIkeys / profiles available in your development environment, run nr1 credentials:list
# after regenerating your uuid publish to your account
nr1 nerdpack:publish [--profile=your_profile_name]
```

Visit [https://one.newrelic.com](https://one.newrelic.com), and launch your app in New Relic.

## Getting started


1. Ensure that you have [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [NPM](https://www.npmjs.com/get-npm) installed. If you're unsure whether you have one or both of them installed, run the following commands. (If you have them installed, these commands return a version number; if not, the commands aren't recognized.)
```bash
git --version
npm -v
```
2. Install the [NR1 CLI](https://one.newrelic.com/launcher/developer-center.launcher) by going to [the developer center](https://one.newrelic.com/launcher/developer-center.launcher), and following the instructions to install and set up your New Relic development environment. This should take about 5 minutes.
3. Execute the following command to clone this repository and run the code locally against your New Relic data:

```bash
nr1 nerdpack:clone -r https://github.com/newrelic/nr-labs-widget-pack.git
cd nr-labs-widget-pack
nr1 nerdpack:serve
```

Visit [https://one.newrelic.com/?nerdpacks=local](https://one.newrelic.com/?nerdpacks=local) to launch your app locally.


# Support

New Relic has open-sourced this project. This project is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT. Issues and contributions should be reported to the project here on GitHub.

We encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

## Issues / enhancement requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](../../issues). Please search for and review the existing open issues before submitting a new issue.

## Security

As noted in our [security policy](https://github.com/newrelic/nr-labs-widget-pack/security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

# Contributing

Contributions are encouraged! If you submit an enhancement request, we'll invite you to contribute the change yourself. Please review our [Contributors Guide](CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource+nrlabswidgetpack@newrelic.com.
