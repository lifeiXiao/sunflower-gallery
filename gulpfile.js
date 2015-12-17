var gulp = require('gulp'),
    src = gulp.src,
    dest = gulp.dest,
    less = require('gulp-less'),
    autoprefixer = require('gulp-autoprefixer'),
    jade = require('gulp-jade'),
    //debug = require('gulp-debug'),
    //jshint = require('gulp-jshint'),
    //uglify = require('gulp-uglify'),
    //concat = require('gulp-concat'),
    contains = require('gulp-contains'),
    watch = require('gulp-watch'),
    environment = {
        prod: {
            name: 'prod'
        },
        beta: {
            name: 'beta'
        },
        dev: {
            name: 'dev'
        }
    },
    ignore = [
        '!node_modules/**',
        '!compiled/**'
    ],
    filesToCompile = function(extension){
        return ['**/**.' + extension, '!**/_*.' + extension].concat(ignore);
    },
    filesNotToCompile = function(extension){
        return['**/_*.' + extension].concat(ignore);
    },
    moduleFiles = function(extension) {
        return ['./module/**/*.' + extension];
    },
    //pageFiles = function(extension) {
    //    return ['./page/**/*.' + extension];
    //},
    indexFile = function(extension) {
        return ['./index.' + extension, './static.' + extension];
    },
    helpers = {
        getFile: {},
        compileImportingFiles: {},
        compileless: {},
        compilejade: {},
        compileSavedFile: {},
        applyFileWatcher: {}
    };

environment.current = environment.prod;


    /* gulp tasks */

    /**
     * default task, executes other tasks
     */
    gulp.task('default', ['watchLess', 'watchJade']);


    /**
     * watchLess task, watches module-, page- and static less files
     * and compiles them and or the files that are importing them
     */
    gulp.task('watchLess', function(){
        helpers.applyFileWatcher('less');
    });

    /**
     * watchJade task, watches module-, page- and index jade files
     * and compiles them and or files that are importing them
     */
    gulp.task('watchJade', function(){
        helpers.applyFileWatcher('jade');
    });

    gulp.task('watchJs', function() {
        helpers.applyFileWatcher('js');
    });


    /**
     * Helper function, gets the filename and extension from a path string.
     * @param {string} path Path string of the file you want to get
     * @returns {string} the file + extension string
     */
    helpers.getFile = function(path){
        return path.split('\\').pop();
    };

/**
 * Helper function that compiles all files that are importing a specific file.
 * Files with '_' prefix don't get compiled!
 * @param file the file that should be imported by ohter files so they get compiled
 */
    helpers.compileImportingFiles = function(file) {
        var extension = file.split('.').pop();

    src(filesNotToCompile(extension))
        .pipe(contains({
            search: file,
            onFound: function(string, file, cb){
                helpers.compileImportingFiles(helpers.getFile(file.path));
                return false;
            }
        }));
    src(filesToCompile(extension))
        .pipe(contains({
            search: file,
            onFound: function(string, file, cb){
                helpers['compile' + extension](src(file.path));
                return false;
            }
        }))
};

/**
 * Helper function to compile a stream of less files.
 * @param {vinyl} stream Vinyl representation of the less files to be compiled
 */
helpers.compileless = function (stream){
    stream
        .pipe(less({
            globalVars: {
                'environment' : environment.current
            }
        }))
        .pipe(autoprefixer({
            browsers: [
                'Android >= 4',
                'last 2 Chrome versions',
                'last 2 ff versions',
                'ie >= 8',
                'iOS >= 6',
                'last 2 Opera versions',
                'Safari >= 5',
                'last 2 op_mob versions',
                'last 2 op_mini versions',
                'last 2 and_chr versions',
                'last 2 and_ff versions',
                'last 2 ie_mob versions'
            ]
        }))
        .pipe(dest('compiled'));
};

/**
 * Helper function to compile a stream of jade files
 * @param {vinil} stream Vinyl representation of the jade files to be compiled
 */
helpers.compilejade = function(stream){
    stream
        .pipe(jade({
            basedir: __dirname,
            pretty: true,
            locals: {
                'environment': environment.current
            }
        }))
        .pipe(dest('./'))
};

/**
 * Helper function to compile a less or jade file that was saved before
 * @param {string} path The path of the file that was saved
 */
helpers.compileSavedFile = function(path) {
    var file,
        extension = (file = path.split('\\').pop()).split('.').pop();

    if (file.indexOf('_') === 0){
        return;
    }
    helpers['compile' + extension](src(path));
};

/**
 * Helper function to apply a file watcher for files to compile with a certain extension.
 * Works for less and jade files.
 * Files with '_' prefix are not compiled.
 * @param extension The extension that the watcher should listen too
 */
helpers.applyFileWatcher = function(extension) {
    watch(moduleFiles(extension).concat(indexFile(extension)), function(event){
        helpers.compileImportingFiles(helpers.getFile(event.path));
        helpers.compileSavedFile(event.path);
    });
};
