# H5P Advanced Blanks

Note. view this MD file in https://dillinger.io/

This is an advanced 'Fill the blanks' content type for h5p. In addition to most of the features of the regular 'Fill the blanks' content type it supports:

* The content creator can specify a feedback text message that should be displayed to the users when they enter a certain incorrect answer.
* The content creator can specify parts of the text that should be highlighted when the users enter a certain incorrect answer. ("signal words")
* The content creator can use text snippets to avoid retyping the same feedback message over and over.
* User are given more detailed feedback when they make spelling mistake.

It's main use is for foreign language learning, where you can give the users individual hints, why certain tenses or word forms can't be used in this case. While it is possible to have a 'Check' button at the end, it makes more sense to use the auto-check setting as the user is guided through the 'fill the blanks' exercise blank by blank.

## This is the 'papi Jo' version of Sebastian's Advanced Fill the Blanks
It's a work in progress, with a number of new features.
The most notable new feature being the use of Regular Expressions to ananlyse the student's answers.
For examples, tutorial and more information, go to https://www.rezeau.org/moodle/

## Architecture

This content type uses parts of h5p-blanks but is not based on it, as it was ported over from a widget written by the author for LearningApps.org. It uses a MVC style architecture with Ractive as the library responsible for creating the views. It is written in TypeScript.

## Getting started

Of course you must have installed nodejs, npm etc. on your computer.

If using Windows; you must run those commands in Windows PowerShell.

```bash
npm install
```
If warnings "deprecated" are displayed:

```bash
npm update
```
*If you are using Windows*, now you need to run this command:
```bash
npm run copy
```

##### If you only want to build a working version of H5P.AdvancedBlanksPapiJo, execute:
```bash
npm run build
```

##### If you want to edit the scripts
... you need to setup a develpment environment to be able to check the syntax of your scripts
```bash
npx eslint
```
if you get some messages then proceed per instructions on the screen

*Need to install the following packages:
eslint@9.14.0
Ok to proceed? **(y)***

If you get the error *Cannot find package 'globals' imported from YOUR_DIRECTORY/H5P.AdvancedBlanksPapiJo-1.1\eslint.config.mjs* Do this:
```bash
npm install globals
```
try again to do: 
```bash
npx eslint
```
or (with the same result)
```bash
npm run lint
```
Normally you should get no errors... until you tamper with the scripts etc.

Now you are set to use your development environment to edit the scripts:
Run this:
```bash
npm run watch
```


