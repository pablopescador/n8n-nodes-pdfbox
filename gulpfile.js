const { src, dest } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.{png,svg}')
		.pipe(dest('dist/nodes'));
}

function copyScripts() {
	return src('scripts/**/*')
		.pipe(dest('dist/scripts'));
}

exports['build:icons'] = buildIcons;
exports['build:scripts'] = copyScripts;
exports['build'] = require('gulp').series(buildIcons, copyScripts);
