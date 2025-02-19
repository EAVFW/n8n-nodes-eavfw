const { src, dest } = require('gulp');

function copyIcons() {
	return src('nodes/**/*.{png,svg}').pipe(dest('.n8n/custom/nodes'));
}

exports.build = copyIcons;
exports['build:icons'] = copyIcons;