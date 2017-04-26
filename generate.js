#!/usr/bin/env node

var fs = require('fs'),
    PNG = require('pngjs').PNG;
const sleep = require('sleep');

var Adir = __dirname+'/aggregate/A1';
var Bdir = __dirname+'/aggregate/B1';

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

var k = process.argv[3];

Adir = __dirname+'/aggregate/A'+k;
Bdir = __dirname+'/aggregate/B'+k;

if (!fs.existsSync(Adir)){
	fs.mkdirSync(Adir);
}

if (!fs.existsSync(Bdir)){
	fs.mkdirSync(Bdir);
}

generate(k);

function generate(dirindex){
	
var palettes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

if(palettes[0][5]){
	// remove duplicates
	for(var j=0; j<palettes.length-1; j++){
		var current = palettes[j];
		var next = palettes[j+1];
		var identical = true;
		for(var k=0; k<5; k++){
			if(Math.abs(current[k][0]-next[k][0])+Math.abs(current[k][1]-next[k][1])+Math.abs(current[k][2]-next[k][2]) > 20){
				identical = false;
				break;
			}
		}
		
		if(identical){
			palettes.splice(j, 1);
			j--;
		}
	}
	
	palettes.sort(function(a,b){
		return b[5] - a[5];
	});
}

for(var j=0; j<palettes.length; j++){
	while(palettes[j].length > 5){
		palettes[j].pop();
	}
}

palettes = palettes.slice(0, Math.floor(palettes.length*Number(process.argv[4])));

shuffle(palettes);

for(var i=0; i<palettes.length; i++){
	var p = palettes[i];
	if(p.length < 5){
		continue;
	}
	
	var rgb = [];
	
	p.forEach(function(hex){
		if(hex.length == 3){
			rgb.push({r: hex[0], g: hex[1], b: hex[2]});
		}
		else{
			hex = '#'+hex.trim();
			rgb.push(hexToRgb(hex));
		}
	});
	
	var stage = 'train';
	var rand = Math.random();
	if(rand < 0.75){
		stage = 'train';
	}
	else if(rand < 0.98){
		stage = 'val';
	}
	else{
		stage = 'test';
	}
	
	var count = 0;
	// 1 color
	for(var j=0; j<5; j++){
		var active = [];
		active.fill(false, 0, 5);
		active[j] = true;
		gen(i, active, rgb, stage, count, dirindex);
		count++;
	}
	
	// 2 colors
	for(j=0; j<4; j++){
		for(var k=j+1; k<5; k++){
			var active = [];
			active.fill(false, 0, 5);
			active[j] = true;
			active[k] = true;
			gen(i, active, rgb, stage, count, dirindex);
			count++;
		}
	}
	
	// 3 colors
	for(j=0; j<4; j++){
		for(var k=j+1; k<5; k++){
			var active = [];
			for(var z=0; z<5; z++){
				active[z] = true;
			}
			active[j] = false;
			active[k] = false;
			gen(i, active, rgb, stage, count, dirindex);
			count++;
		}
	}
	
	// 4 colors
	for(j=0; j<5; j++){
		var active = [];
		for(var z=0; z<5; z++){
			active[z] = true;
		}
		active[j] = false;
		gen(i, active, rgb, stage, count, dirindex);
		count++;
	}
	
	console.log(i);
}
}

function gen(i, active, rgb, stage, count, dirindex){
	
	Adir = __dirname+'/aggregate/A'+dirindex;
	Bdir = __dirname+'/aggregate/B'+dirindex;
	
	var B = new PNG({
		width: 256,
		height: 1,
		filterType: -1
	});
	
	for (var y = 0; y < B.height; y++) {
		for (var x = 0; x < B.width; x++) {
			var cindex = Math.floor(5*(x/256));
			
			var color = rgb[cindex];
			var idx = (B.width * y + x) << 2;
			
			if(active[cindex]){
				B.data[idx  ] = color.r;
				B.data[idx+1] = color.g;
				B.data[idx+2] = color.b;
			}
			else{
				B.data[idx  ] = 0;
				B.data[idx+1] = 0;
				B.data[idx+2] = 0;
			}
			B.data[idx+3] = 255;
			
		}
	}
	
	var A = new PNG({
		width: 256,
		height: 1,
		filterType: -1
	});
	
	for (var y = 0; y < A.height; y++) {
		for (var x = 0; x < A.width; x++) {
			var cindex = Math.floor(5*(x/256));
			var color = rgb[cindex];
			
			var idx = (B.width * y + x) << 2;
			A.data[idx  ] = color.r;
			A.data[idx+1] = color.g;
			A.data[idx+2] = color.b;
			A.data[idx+3] = 255;
		}
	}
	
	if (!fs.existsSync(Adir+'/'+stage)){
		fs.mkdirSync(Adir+'/'+stage);
	}
	if (!fs.existsSync(Bdir+'/'+stage)){
		fs.mkdirSync(Bdir+'/'+stage);
	}
	
	var Abuffer = PNG.sync.write(A);
	var Bbuffer = PNG.sync.write(B);
	fs.writeFileSync(Adir+'/'+stage+'/'+i+'_'+count+'.png', Abuffer);
	fs.writeFileSync(Bdir+'/'+stage+'/'+i+'_'+count+'.png', Bbuffer);
}


