/**
 * Gulpfile for n8n-nodes-kwtsms
 * Copies non-TypeScript assets (icons, JSON) to dist/ during build.
 */
const { src, dest, parallel, task } = require('gulp');

task('build:icons:nodes', function copyNodeIcons() {
	return src('nodes/**/*.{svg,png,json}')
		.pipe(dest('dist/nodes/'));
});

task('build:icons:credentials', function copyCredentialIcons() {
	return src('credentials/**/*.{svg,png}')
		.pipe(dest('dist/credentials/'));
});

exports['build:icons'] = parallel('build:icons:nodes', 'build:icons:credentials');
exports.default = exports['build:icons'];
