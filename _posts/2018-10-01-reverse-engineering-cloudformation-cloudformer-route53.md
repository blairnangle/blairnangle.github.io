---
layout: post
title: "Reverse engineering CloudFormation templates using CloudFormer — Route 53 example"
---

This post tries to explain how to work backwards from a functioning **Route 53** configuration to a codified **CloudFormation** file using Amazon Web Services's **CloudFormer** tool. Note that at the time of writing CloudFormer is still in beta phase.

CloudFormer isn't specific to Route 53 and can be used with a lot of other AWS services. I have chosen Route 53 as an example due to the relative simplicity of the configuration, at least in my example, compared to some other services and because I do not yet have a working version of a CloudFormation Route 53 template.

#### Prerequisites and assumptions
This post is written using the example of hosting a static website (or website front end) using AWS S3, CloudFront and Certificate Manager. That does not mean to say the same method cannot be applied to other configurations, only that any service-specific gotyas won't be included.

#### Getting started: Creating the CloudFormer stack with CloudFormation
CloudFormer isn't a first-class AWS service in the sense that you can't navigate to it via the "Services" drop-down and it won't appear if you try to search for it in the "Find a service by…" search bar, either. If your CloudFormation looks bare (in your [region](https://aws.amazon.com/about-aws/global-infrastructure/)), you will just be able to select CloudFormer. If you already have stacks in your region, select "Create Stack" and then choose "CloudFormer" (under "Tools") from the "Select a sample template" drop-down. Confusingly enough, in order to use CloudFormer (to ultimately create stacks of infrastructure) you must first create a stack for CloudFormer itself, hence the use of the generic stack creation wizard. (This feels to me like an unnecessary overhead that AWS could have avoided and maybe it will change if CloudFormer ever gets a full release but I couldn't find any official information on the matter.)

Give your stack a name and choose a username and password – you will need these to log into your CloudFormer EC2 instance. This may seem like overkill for what we're trying to achieve (and it may well be) but don't worry, your EC2 instance only needs to be running for a few minutes while CloudFormer reverse engineers CloudFormation templates for the resources you select. According to the AWS [documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-using-cloudformer.html):

> CloudFormer is an AWS CloudFormation stack. You run CloudFormer by launching the stack from your AWS environment. It runs on a t2.medium Amazon EC2 instance and requires no other resources.

If you're just playing around with AWS and don't have much in your account, you're probably fine to just use the [default](https://docs.aws.amazon.com/vpc/latest/userguide/default-vpc.html) VPC but if that's not the case, you should create a new VPC in which your CloudFormer stack will be located. 

Given that you are just going to be using this stack for executing CloudFormer tasks, you can leave all the fields and dropdowns in the "Options" stage blank.

Tick the checkbox to say that you're cool with the fact that CloudFormation might create some IAM resources. It's generic for stack creation and in this case a role with the various list and read [permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_understand-policy-summary-access-level-summaries.html) will be created for the CloudFormer application so that it can do its thing. This will be deleted if you choose to delete your CloudFormer stack. Select "Create". Once the status of your stack changes from `CREATE_IN_PROGRESS` to `CREATE_COMPLETE`, you're good to go.

#### Accessing and using the CloudFormer tool
Navigate to your CloudFormer stack and then its "Outputs". There should be one output. Click on its value. Enter your username and password when prompted.

Well done, you're _finally_ ready to use CloudFormer. Choose your region and hit "Create Template". Entering "dns" in the filter box will automatically select any resources that fit that description. You'll still have to navigate through all the other services, just leave them un-ticked. Check that the information on the "Summary" page makes sense and hit "Continue".

Hopefully, you can now see your template. The NS and SOA records will not have been codified and will be created automatically when you create your new hosted zone. You can go ahead and delete your CloudFormer stack or just stop the EC2 instance on which it's running if you want to play around a bit more.

#### A Note: Hosted Zone Names and IDs
It is possible to specify the hosted zone to attach record sets using either `HostedZoneName` or `HostedZoneId`. It's also possible to have more than one hosted zone with the same name. However, the Hosted Zone IDs are unique and if you try to attach a record set or record set group to a hosted zone by defining the name and more than one hosted zone of that name exists, the stack creation will fail.

I have found that referencing the ID (see the template below) of the just-created hosted zone in the template to be more reliable than its name (CloudFormation just seems to complain a bit less).

#### Converting to YAML (optional)
CloudFormer still only supports JSON output (despite AWS themselves [suggesting](https://aws.amazon.com/blogs/mt/the-virtues-of-yaml-cloudformation-and-using-cloudformation-designer-to-convert-json-to-yaml/) that YAML should be the weapon of choice for CloudFormation). You will see the option to save your template to S3 but I prefer to copy and paste it into my relevant project so that it's version-controlled. AWS provides a designer through the Console that can be used to convert JSON to YAML and there are other tools available but my preference is to use AWS Labs's [aws-cfn-template-flip](https://github.com/awslabs/aws-cfn-template-flip) command line tool.

By following the instructions on GitHub and replacing the masked (potentially sensitive) values where appropriate, your template should transform from this:

{% gist 38ee3601d1b327d2b6f7f6394c907e61 %}

To this:

{% gist 3adc4d9f209928a7b3b9d34e9ded05a0 %}

Note that `HostedZoneId` is the same for _all_ CloudFront distributions, that is, `Z2FDTNDATAQYW2`. It also worth mentioning that I am choosing to keep all my files in the root of my project.

#### Deploying your template
Before deploying your template it might be worth taking a screenshot or making a note of your current configuration, in case anything goes wrong.

There are two ways to proceed:

* Running a shell script to create the CloudFormation stack (faster)
* Pushing your code to a hooked-up repo and letting CodePipeline do the stack creation (better)

This post is going to follow the first option. I will have another post coming soon to explain how to create continuous delivery pipelines with CloudFormation and CodePipeline.

Firstly, we'll need to delete your existing Route 53 hosted zone. Confirm that your website is no longer reachable using a new private browser window (in case of caching).

Next, you'll want to create a `parameters` file in which to extract any commonalities. This will be passed as an argument when we create the stack and has to be JSON. Note that CloudFormation will automatically add the period at the end of your top-level domain when creating the hosted zone and record sets. Mine looks like this:

{% gist 5401d47b70f118ffe127e8037fad805d %}

And my resultant template, after making use of some CloudFormation substitution syntax, looks like this:

{% gist d4272b79c7f04e8527d6e86dbeae6923 %}

Then execute the script below from the same directory as your YAML template.

{% gist bf58134a77a018fa4ad6302c00b5f061 %}

#### Name servers (NS) and start-of-authority (SOA) records
Each time you create a new hosted zone in Route 53, Amazon will automatically create NS (one, with four values) and SOA [records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/SOA-NSrecords.html). As far as I'm aware, there is no way to prescribe these for Route 53 — you must use the records created for you.

There is one final, manual step which involves updating the name servers of your registered domain. Note that the relationship between a registered domain and hosted zones is [one-to-many](https://aws.amazon.com/route53/faqs/#create_multiple_hzs_for_same_domain). When you executed the above script and Route 53 generated a new name server record (with four entries), your domain's name servers weren't updated and remained as they were for the first hosted zone you (manually) created in your domain.

If you navigate to Route 53 > Registered domains > _Your Domain_ and check out the list of name servers, you will see that they no longer match the list of addresses in the "Value" field of the "NS" record in your hosted zone. All that remains to be done is to update the name servers values on the registered domain page with the values from your hosted zone record.

[This](https://serverfault.com/questions/838330/deleted-then-recreated-route-53-hosted-zones-now-website-not-working/838396#838396) _Server Fault_ answer does a better job of explaining it than I do.

#### Has it worked?
Validating that the stack creation has been successful is easy: just navigate to CloudFormation via the AWS Console and, like before with the CloudFormer stack, (hopefully) watch the status change from `CREATE_IN_PROGRESS` to `CREATE_COMPLETE`.

If the creation of the stack has been unsuccessful, CloudFormation will try to rollback to the previous (successful) version. Given that this is the first version of the stack and CloudFormation has nothing to which it can rollback, you will have to manually delete the failed stack before tweaking your template and retrying.

To validate that the DNS setup is functioning correctly, the first thing to do is check that everything looks as before in Route 53. Frustratingly, due to DNS propagation [times](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/troubleshooting-new-dns-settings-not-in-effect.html), you won't be able to _fully_ validate that your new configuration is functional straight away.

#### Next
This is a very simple example and it's unlikely that you'll want to regular programmatically deploy Route 53 configurations, though, of course, it is always useful to have them codified. I just wanted to show the power of CloudFormer, especially if you're someone (like me) who has spent a long time painfully tweaking CloudFormation templates.
