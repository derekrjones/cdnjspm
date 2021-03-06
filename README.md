# cdnjspm

Get your libraries and scripts from the interwebs fast and easy!

cdnjspm is forked from [Fletch](https://github.com/yannvanhalewyn/fletch).
Changes:
* Change project name to help other easily find and use

![general screenshot](http://i.imgur.com/t5qlkVr.png "Screenshot")

## Installation

```
$ npm install -g cdnjspm
```

This gives you a command-line command you can run from anywhere in your system.

## Usage

```
$ cdnjspm <packageName> [options]
```

### Options
    -o, --options	Specify the ouput directory
    -v, --version	Specify a version (semver support)
    -h, --help		Show help page
    -s, --silent	Discrete output: will only show prompts
    -m, --minimal	Download only the main file (e.g.: jquery.min.js)
    -t, --tag		Prints out html script/link tags instead of downloading

**NOTE** the --tag option will only print out tags for .js and .css files.


### Examples
```
$ cdnjspm jquery
```
Downloads latest version of jQuery to `jquery/${last_version}/` folder

```
$ cdnjspm jquery -o lib/deps
```
Downloads latest version of jQuery to the lib/deps/ directory

```
$ cdnjspm jquery -v "<2"
```
Downloads a version of jQuery that's lower than 2.0.0

```
$ cdnjspm jquery -t
```
Prints out a script tag for every file in the package

## Tags
![Tags screenshot](http://i.imgur.com/WEXAeVu.png)

## Conflicts

Fletch prompts the user when multiple packages have been found
![Conflict screenshot](http://i.imgur.com/2JIsNbs.png)

## Dependencies

Fletch scans for dependencies and asks you if you want'em.
![Dependency screenshot](http://i.imgur.com/pBSW5mS.png)

## Dependency conflicts

Will, again, ask you to resolve any conflicts found when looking for dependent
files.
![Dependency conflict](http://i.imgur.com/qZyTxGF.png)
