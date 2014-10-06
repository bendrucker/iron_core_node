'use strict';

var gulp    = require('gulp');
var plugins = require('gulp-load-plugins')();

gulp.task('lint', function () {
  return gulp.src('./src/*.js')
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('cover', function () {
  return gulp.src('./src/**/*.js')
    .pipe(plugins.istanbul());
});

gulp.task('test', ['cover'], function () {
  return gulp.src('./test/specs/**/*.js')
    .pipe(plugins.mocha())
    .pipe(plugins.istanbul.writeReports({
      reporters: ['text']
    }));
});