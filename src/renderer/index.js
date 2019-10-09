// Initial welcome page. Delete the following line to remove it.
'use strict';

import jQuery from 'jquery'
import scollintoview from './helpers/scrollintoview.js'
import { remote, clipboard, shell } from 'electron'
import settings from 'electron-settings'
import * as path from 'path'
import fs from 'fs'
import ks from 'node-key-sender'
import css from './main.css'
import tpl_app from './tpl_app.html'


window.$ = window.jQuery = jQuery
var kbsettings = settings.get('kbfolder.path')
if(typeof kbsettings != 'undefined'){
	var folderPath = settings.get('kbfolder.path')[0]
} else {
	var folderPath = false
}


init();

function init(){
	$("#app").html(tpl_app);

	let rest_url = settings.get('kbsnippetapi.url')
	if(typeof rest_url == 'undefined' || rest_url == '' ){
		rest_url = false
	}

	let content = '';

	jQuery(document).ready(function() {

		let username = settings.get('kbsnippetapiauth.user');
		let password = settings.get('kbsnippetapiauth.password');
		let auth = "Basic " + btoa(username + ":" + password);
		$.ajaxSetup({
			headers : {
				'Authorization' : auth,
			}
		});

		$(document).on("click",".kbelement-snippet", function(event){
			console.log(event.target);
			if(jQuery(event.target).hasClass('kb-snippet-edit')){
				let id = jQuery(event.target).attr('data-id')
				shell.openExternal( settings.get('kbsnippeteditapi.url') + id);          
			} else {
				copyPasteSnippet(this)
			}
		});
		$(document).on("click",".kbelement-file",function() {
			copyPasteFile(this)
		});

		if(rest_url != false){
			//populate with json data
			//$.getJSON(rest_url + "?_jsonp=?",function(json){
			$.getJSON(rest_url ,function(json){
				content = '';
				jQuery(json).each(function(index, kb){
					content += '<div class="kbelement kbelement-snippet" tabindex="0">';
					content += '<p class="title">'+ kb['content-categories'] + kb.title.rendered +'</p>';
					content += '<p class="content" data-id="'+ kb.id +'">'+ kb['content-unrendered'] +'</p>';
					content += '<span class="kb-snippet-edit" data-id="'+ kb.id +'" >Edit</span>'
					content += '</div>';
				});
				jQuery('#lista').append(content);
				addScrollClass();
			});
		}
		
		// populate with file -> content
		content = '';
		jQuery.each(walkSync(folderPath), function(index, value){
			content += '<div class="kbelement kbelement-file" tabindex="0">'
			content += '<p class="title">'+ value['file'] +'</p>'
			content += '<p class="content" data-path="'+ value['path'] +'">'+ value['content'] +'</p>'
			content += '</div>'
		});
		jQuery('#lista').append(content);

		//filter
		jQuery("#search").on("keyup", function () {
			var value = this.value.toLowerCase().trim();
			var value_arr = value.split(" ");
			jQuery("#lista div").show().filter(function () {
				for (let i = 0; i < value_arr.length ; i++) {
		    		var maybeHide = jQuery(this).text().toLowerCase().trim().indexOf(value_arr[i]);
		    		console.log(maybeHide);
		    		if (maybeHide == -1){
		      			return maybeHide;
		    		}
		  		}
			}).hide();
			addScrollClass()
		})

		// initial scroll detect
		addScrollClass()

		// output folder from settings
   		jQuery("footer span").text('folder: ' + folderPath + ' & url: ' + rest_url);

	})

	jQuery(document).keydown(function(e) {
		if (e.keyCode==38) {
			e.preventDefault();
			navigate(e.target, -1);
		}
		if (e.keyCode==40) {
			e.preventDefault();
			navigate(e.target, 1);
		}

		if (e.keyCode==13) {
			// we can't see it but it works.
			// can listen for the click event in order to send info back to the OS.
			jQuery(e.target).trigger('click');
		}
		if (e.keyCode!==40 && e.keyCode!==38 && e.keyCode!==13) {
			jQuery("#search").focus()
			// recalculate scroll
		}
	});

}

function navigate(origin, sens) {
	var inputs = jQuery('#lista').find('.kbelement').filter(function() {
		return jQuery(this).css("display") !== 'none';
	});
	var index = inputs.index(origin);
	index += sens;
	if (index < 0) {
		index = inputs.length - 1;
	}
	if (index > inputs.length - 1) {
		index = 0;
	}
	inputs.eq(index).focus();
}

function addScrollClass(){
	jQuery("#lista").removeClass("hasScrollbar");
	jQuery("#lista:scrollable").addClass("hasScrollbar");
}


function timedSendCombination(ks){
	ks.sendCombination(['control', 'v']).then(
	    function(stdout, stderr) {
	        window.close();
	    },
	    function(error, stdout, stderr) {
	        console.log('ks error: ' + error);
   			//window.close();
	    }
	);
}

const walkSync = (dir, filelist = []) => {
  if (dir === false){
  	return []
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);

    if (dirent.isDirectory()) {
      //console.log('directory', path.join(dir, file));
      var odir = {
        file: dirFile.replace(folderPath+'/', ''),
        files: [],
        isDir: 'true'
      }

      //odir.files = walkSync(dirFile, dir.files);
      //filelist.push(odir);

      odir.files = walkSync(dirFile, dir.files);
      filelist = filelist.concat(odir.files);
    } else if( dirent.size < 10000 && dirFile.indexOf('.txt') == dirFile.length - 4 ){
    	const fileContent = fs.readFileSync(dirFile, 'utf8')
   		filelist.push({
     		file: dirFile.replace(folderPath+'/', ''),
     		content: fileContent,
     		path: dirFile
       	});

    }
  }
  return filelist;
};


function copyPasteFile(element) {
	var window = remote.getCurrentWindow();
	window.minimize();
	let fileContent = fs.readFileSync(jQuery(element).find('.content').attr('data-path'), 'utf8');

	let promise = new Promise(function(resolve, reject) {
		// do a thing, possibly async, then…
		clipboard.writeText(fileContent)
		if (clipboard.readText() == fileContent) {
			resolve("Stuff worked!");
		}
		else {
			reject(Error("It broke"));
		}
	});

	promise.then(function(data){
		timedSendCombination(ks);
	});
}

function copyPasteSnippet(element) {
	let rest_url = settings.get('kbsnippetapi.url')
	if(typeof rest_url == 'undefined' || rest_url == '' ){
		console.log("No Rest URL defined.")
		return;
	}
	let window = remote.getCurrentWindow();
	window.minimize();

	let id = jQuery(element).find('.content').attr('data-id')
	$.getJSON(rest_url + id,function(json){
		let content = json['content-unrendered'];
		let promise = new Promise(function(resolve, reject) {
			// do a thing, possibly async, then…
			clipboard.writeText(content);
			if (clipboard.readText() == content) {
				resolve("Stuff worked!");
			}
			else {
				reject(Error("It broke"));
			}
		});

		promise.then(function(data){
			timedSendCombination(ks);
		});
	});
}
