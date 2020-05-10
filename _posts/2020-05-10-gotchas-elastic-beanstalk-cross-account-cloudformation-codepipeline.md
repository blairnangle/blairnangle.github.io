---
layout: post
title: "Gotchas: Elastic Beanstalk and Cross-Account CodePipeline with CloudFormation"
---

## Overview

Building a cross-account continuous delivery pipeline for a simple Spring Boot Elastic Beanstalk app using CodePipeline 
and CloudFormation.

[Jump straight to source code.](https://github.com/blairnangle/example-elastic-beanstalk-cross-account-codepipeline-cloudformation)

## Introduction

This post will not provide step-by-step instructions for provisioning the AWS infrastructure—hopefully the 
[source code](https://github.com/blairnangle/example-elastic-beanstalk-cross-account-codepipeline-cloudformation) is reasonably self-explanatory. Instead, this post hopes to identify and document some common
gotchas.

I have opted for a solution that deploys infrastructure then application code in a single pipeline.

## Prerequisites

Prerequisites for using recreating the example are documented in the [GitHub project](https://github.com/blairnangle/example-elastic-beanstalk-cross-account-codepipeline-cloudformation).

## Gotchas

### Permissions

The trickiest thing about doing cross-account deployments with AWS is granting enough permissions to the relevant 
services while still following the [principle of least privilege](https://circleci.com/blog/minimize-risk-using-the-principle-of-least-privilege-and-aws-iam-permissions/). 
For me, in practice, this sometimes meant over-allocating permissions while developing and gradually removing while 
refactoring, often by trial and error in both scenarios.

### Order of Resource Creation

The order in which I have chose to create resources can be understood from the `go` script. The `dummyPipeline` stack 
must be created last and the `dummyPreReqs` stack must be created before `dummyIam`. Reasons for this include but are not
limited to:

* The S3 bucket that acts as the artifact store for the pipeline and its associated customer master key need to exist
before the pipeline can reference and create roles with permissions to access them
* The creation of `dummyPreReqs` involves adding dynamically adding values to the parameters of `dummyIam`
* The creation of `dummyElasticBeanstalk` involves adding dynamically adding values to the parameters of 
`dummyPipeline`—the pipeline needs to know the application and environment to which it will deploy

The same rules are reversed in the `destroy` script.

### Artifact S3 Bucket (tools account)

Storage to back the pipeline.

### Customer Master Key (CMK) in Key Management Service (KMS) (tools)

When using CodePipeline in a single environment, CodePipeline can implicitly use the account's default KMS key for 
encryption and decryption. However, whenever sharing artifacts between accounts, we need to define our own key in our 
tools account and permit our test account to use it.

### Initial Creation of Elastic Beanstalk Application and Environment

To deploy your own code to Elastic Beanstalk via a CI/CD pipeline, CodePipeline needs to know the name of the 
application and environment. This is achieved by initially creating an Elastic Beanstalk stack from a template 
without an [application version SourceBundle](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-sourcebundle.html).
This results in the default app being deployed the first time your Elastic Beanstalk resources are created:

![Default Elastic Beanstalk Application](/assets/2020-05-10-gotchas-elastic-beanstalk-cross-account-cloudformation-codepipeline/elastic-beanstalk-default.png)

The `./go` script uses the application and environment names created in the initial creation of the Elastic Beanstalk 
stack to connect the CodePipeline deployment stage with the correct app, meaning subsequent deployments will use 
artifacts built by the CodeBuild project (and ultimately sourced from your GitHub repository).

### Implicit Stack Creation

CloudFormation and Elastic Beanstalk work together to create an auxiliary stack with all the scaffolding infrastructure 
that Elastic Beanstalk needs. I have defined close to the bare minimum for creating an Elastic Beanstalk app and 
environment in `elastic-beanstalk.yml`. The  

### Security Groups

The auxiliary stack will create a default load balancer security group allowing ingress access from anywhere and  This
security group is seemingly deleted upon the first *actual* deployment to Elastic Beanstalk (when the default app is 
replaced by my own, sourced from GitHub). At this point, the EC2 instances associated with the Elastic Beanstalk app 
have their security group replaced with a self-referential security group that allows traffic from and to any other 
resource within the account's default VPC.

I haven't been able to find definitive reason for why this happens. I am assuming that it is a safeguarding measure 
to prevent users from accidentally exposing their own application to whole internet.

I found [this](https://stackoverflow.com/a/28384498/4304123) Stack Overflow answer very helpful.

### Reasoning for Pipeline Stages

### Port Number

Elastic Beanstalk by default expects the application to be listening on port 5000. Opting for convention rather 
than any additional configuration, `server.port=5000` is configured in `src/main/resources/application.properties`.

### Pipeline Fails First Time

As soon as the pipeline has been successfully provisioned, an execution will be kicked off. This first run will fail at 
the Source stage because the CodePipeline and CodeBuild roles will not yet have been added as principals to the CMK 
(this happens as the very last step in the `./go` script) and so will not be able to encrypt and store the `sourced`
artifact from GitHub. Clicking "Release change" or pushing a change to GitHub once the `dummyPreReqs` stack has been 
updated should cause Source to succeed.

### Deleting

I created `./destroy` to automate the process of tearing everything down while ensuring order. If you want to delete
things manually via the AWS console, be aware of the following:

* Remove the `dummyIam` stack last in the test environment (it contains IAM resources that are needed to delete the 
`dummyElasticBeanstalk` stack and associated automatically-created stack)
* Empty the artifact bucket (tools account) before trying to delete the `dummyPreReqs` stack

## Caveats

No *serious* thoughts around security, VPC or custom domain configuration. Or proper logging. Or lots of other 
important stuff.

## Acknowledgements

* AWS - Labs's [aws-refarch-cross-account-pipeline](https://github.com/awslabs/aws-refarch-cross-account-pipeline)
* [This](https://stackoverflow.com/a/28384498/4304123)
Stack Overflow answer on default security groups
* CircleCI [blog post](https://circleci.com/blog/minimize-risk-using-the-principle-of-least-privilege-and-aws-iam-permissions/) 
that provides an introduction to the principle of least privilege
