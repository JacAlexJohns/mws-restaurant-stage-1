var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var jasmine = require('gulp-jasmine-phantom');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var babel = require('gulp-babel');
var cleanCSS = require('gulp-clean-css');

gulp.task('dist', [
  'copy-html',
  'copy-manifest',
  'copy-min-images',
  'styles',
  'min-js'
]);

gulp.task('min-js', function() {
	gulp.src(['js/idb.js', 'js/dbhelper.js', 'sw.js', 'js/jquery.js', 'js/jquery.lazyloadxt.js'])
		.pipe(concat('small.js'))
		.pipe(uglify())
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-html', function() {
	gulp.src('./*.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-manifest', function() {
  gulp.src('./manifest.json')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-min-images', function() {
	gulp.src('img/*')
    .pipe(imagemin({
      progressive: true,
      use: [pngquant()]
    }))
    .pipe(imagemin([
      imagemin.jpegtran({progressive: true})
    ]))
		.pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function() {
  gulp.src('css/*.css')
    .pipe(cleanCSS({ level: 1 }))
    .pipe(gulp.dest("dist/css"));
});
