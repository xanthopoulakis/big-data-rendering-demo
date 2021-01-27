# Big Data Rendering Demo

A demo project to demostrate visualising big data via heavy data files in JSON and in Apache Arrow format and rendering it on WebGL using the Regl Javascript library.

## Requirements

For execution, you will only need Node.js installed on your environment.

You also need git-lfs installed on your machine to checkout the repository.

    brew install git-lfs

### Node

[Node](http://nodejs.org/) is really easy to install and now includes [NPM](https://npmjs.org/).
You should be able to run the following command after the installation procedure
below:

    $ node --version
    v0.10.24

    $ npm --version
    1.3.21

#### Node installation on OS X

Please install [Homebrew](http://brew.sh/) if it's not already done with the following command:

    $ ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"

If everything when fine, you should run

    brew install node

#### Node installation on Linux

    sudo apt-get install python-software-properties
    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs

#### Node installation on Windows

Just go on [official Node.js website](http://nodejs.org/) & grab the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it.

---

## Install

    $ git clone git@github.com:xanthopoulakis/big-data-rendering-demo.git
    $ npm install

## Start application

In the project folder, you may initiate the application via the terminal:

    $ cd big-data-rendering-demo/
    $ ./start.sh

In case it doesn't start automatically, open your preferred browser and navigate to the url

    http://localhost:8080/index.html


---

## Configuration

The application is reading

- the intervals, from the json file in /json/onekg.random.100.json
- the scatterplot data from the Apache Arrow file in /data.arrow
- the chromosome metadata from the json file in gGnome.js/json/metadata.json

