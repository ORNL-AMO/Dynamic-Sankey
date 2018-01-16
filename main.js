/**
 * Created by Michael on 11/1/2017.
 */

const electron = require('electron');
const url = require('url');
const path = require('path');

const{app, BrowserWindow} = electron;

//SET ENV
process.env.Node_ENV = 'production';

let mainWindow;

//Listen for the app to be ready
app.on('ready', function(){

    mainWindow = new BrowserWindow();

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', function () {
        mainWindow = null
    });

    mainWindow.maximize();
});