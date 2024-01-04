const gulp = require('gulp');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const nodemon = require('gulp-nodemon');
const todo = require('gulp-todo');
const Mocha = require('mocha');
const fs = require("fs");
const path = require("path");
const PluginError = require('plugin-error');

function buildServer() {
    let task = gulp.src(['src/server/**/*.*', 'src/server/**/*.js']);
    if (!process.env.IS_DEV) {
        task = task.pipe(babel())
    }
    return task.pipe(gulp.dest('bin/server/'));
}

function runServer(done) {
    nodemon({
        delay: 10,
        script: './bin/server/server.js',
        ignore: ['bin/'],
        ext: 'js html css',
        done,
        tasks: [process.env.IS_DEV ? 'dev-server' : 'build-server']
    })
}

function setDev(done) {
    process.env.IS_DEV = 'true';
    done();
}

function mocha(done) {
    const mochaInstance = new Mocha()
    const files = fs
        .readdirSync('test/', {recursive: true})
        .filter(x => x.endsWith('.js')).map(x => path.resolve('test/' + x));
    for (const file of files) {
        mochaInstance.addFile(file);
    }
    mochaInstance.run(failures => failures ? done(new PluginError('mocha', `${failures} test(s) failed`)) : done());
}

gulp.task('lint-server', () => {
    return gulp.src(['src/server/**/*.js', '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test-server', gulp.series('lint-server', mocha));

gulp.task('todo-server', gulp.series('lint-server', () => {
    return gulp.src('src/server/**/*.js')
        .pipe(todo())
        .pipe(gulp.dest('./'));
}));

gulp.task('build-server', gulp.series('lint-server', buildServer, mocha));

gulp.task('dev-server', gulp.parallel(buildServer));

gulp.task('run-server', gulp.series('build-server', runServer));

gulp.task('watch-server', gulp.series(setDev, 'dev-server', runServer));

gulp.task('default', gulp.series('run-server'));
