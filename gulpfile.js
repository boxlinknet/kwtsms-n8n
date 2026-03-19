/**
 * Gulpfile for n8n-nodes-kwtsms
 * Copies non-TypeScript assets (icons, JSON) to dist/ during build.
 */
const { src, dest, task } = require('gulp');

task('build:icons', function copyIcons() {
	return src('nodes/**/*.{svg,png,json}')
		.pipe(dest('dist/nodes/'));
});

exports.default = exports['build:icons'] = task('build:icons');
