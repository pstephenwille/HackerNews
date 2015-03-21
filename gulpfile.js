var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var react = require('gulp-react');
var htmlreplace = require('gulp-html-replace');

var path = {
    HTML: 'src/index.html',
    ALL: ['jsx/*.jsx', 'app.jsx', 'index.html'],
    JS: ['jsx/*.jsx', 'app.jsx'],
    MINIFIED_OUT: 'build.min.js',
    DEST_SRC: 'server/public/dist/src',
    DEST_BUILD: 'server/public/dist/build',
    DEST: 'dist'
};

gulp.task('transform', function(){
    gulp.src(path.JS)
        .pipe(react())
        .pipe(gulp.dest(path.DEST_SRC));
});

gulp.task('copy', function(){
    gulp.src(path.HTML)
        .pipe(gulp.dest(path.DEST));
});

gulp.task('watch', function(){
    gulp.watch(path.ALL, ['transform', 'copy', 'build']);
});

gulp.task('build', function(){
    console.log('build');
    gulp.src(path.JS)
        .pipe(react())
        .pipe(concat(path.MINIFIED_OUT))
        .pipe(uglify(path.MINIFIED_OUT))
        .pipe(gulp.dest(path.DEST_BUILD));
});

gulp.task('replaceHTML', function(){
    gulp.src(path.HTML)
        .pipe(htmlreplace({
            'js': 'build/' + path.MINIFIED_OUT
        }))
        .pipe(gulp.dest(path.DEST));
});


4
gulp.task('dev', ['watch']);
gulp.task('prod', ['replaceHTML', 'build']);