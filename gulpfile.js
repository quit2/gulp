
var gulp			= require('gulp');

// gulp组件
var less            = require('gulp-less'),
    autoprefixer    = require('gulp-autoprefixer'),
    postcss         = require('gulp-postcss'),
	uglify 			= require('gulp-uglify'),			// JS文件压缩
	imagemin 		= require('gulp-imagemin'),		    // imagemin 图片压缩
	pngquant 		= require('imagemin-pngquant'),	    // imagemin 深度压缩
	livereload 		= require('gulp-livereload'),		// 网页自动刷新（服务器控制客户端同步刷新）
	webserver 		= require('gulp-webserver'),		// 本地服务器
	rename 		    = require('gulp-rename'),			// 文件重命名
	sourcemaps    	= require('gulp-sourcemaps'),		// 来源地图
	changed 		= require('gulp-changed'),			// 只操作有过修改的文件
	concat 			= require("gulp-concat"), 			// 文件合并
	clean 			= require('gulp-clean');			// 文件清理


var srcPath = {
	html	: 'src',
	css		: 'src/css',
	script	: 'src/js',
	image	: 'src/images',
	less    : 'src/less'
};
var destPath = {
	html	: 'dist',
	css		: 'dist/css',
	script	: 'dist/js',
	image	: 'dist/images'
};

/* = 开发环境( Ddevelop Task )
-------------------------------------------------------------- */
	// HTML处理
	gulp.task('html', function() {
		return gulp.src( srcPath.html+'/**/*.html' )
			.pipe(changed( destPath.html ))
			.pipe(gulp.dest( destPath.html ));
	});

	gulp.task('css', function () {
		return gulp.src( srcPath.css+'/*.css' )
			.pipe(autoprefixer({
		      browsers: ['last 2 versions', 'Android >= 4.0'], // 主流浏览器的最新两个版本
		      cascade: false // 是否美化属性值
		    }))
			.pipe(gulp.dest( destPath.css ));
	});

	gulp.task('less', function () {
		return gulp.src( srcPath.less+'/*.less' )
		    .pipe(changed( destPath.css ))
			.pipe(sourcemaps.init())
			.pipe(less())
			.pipe(autoprefixer({
		      browsers: ['last 2 versions', 'Android >= 4.0'], // 主流浏览器的最新两个版本
		      cascade: false // 是否美化属性值
		    }))
			.pipe(gulp.dest( destPath.css ));
	});

	// JS文件压缩&重命名
	gulp.task('script', function() {
		return gulp.src( [srcPath.script+'/*.js','!'+srcPath.script+'/*.min.js'] ) // 指明源文件路径、并进行文件匹配，排除 .min.js 后缀的文件
			.pipe(changed( destPath.script )) // 对应匹配的文件
			.pipe(sourcemaps.init()) // 执行sourcemaps
			.pipe(rename({ suffix: '.min' })) // 重命名
			.pipe(uglify()) // 使用uglify进行压缩，并保留部分注释
			.pipe(sourcemaps.write('maps')) // 地图输出路径（存放位置）
			.pipe(gulp.dest( destPath.script )); // 输出路径
	});
	// imagemin 图片压缩
	gulp.task('images', function(){
		return gulp.src( srcPath.image+'/**/*' ) // 指明源文件路径，如需匹配指定格式的文件，可以写成 .{png,jpg,gif,svg}
			.pipe(changed( destPath.image ))
			.pipe(imagemin({
				progressive: true, // 无损压缩JPG图片
				svgoPlugins: [{removeViewBox: false}], // 不要移除svg的viewbox属性
				use: [pngquant()] // 深度压缩PNG
			}))
			.pipe(gulp.dest( destPath.image )); // 输出路径
	});

	// js文件合并
	gulp.task('concat', function () {
		return gulp.src( srcPath.script+'/*.min.js' )  // 要合并的文件
		.pipe(concat('all.js')) // 合并成libs.js
		.pipe(rename({ suffix: '.min' })) // 重命名
		.pipe(gulp.dest( destPath.script )); // 输出路径
	});

	// 本地服务器
	gulp.task('webserver', function() {
		gulp.src( destPath.html ) // 服务器目录（.代表根目录）
		.pipe(webserver({ // 运行gulp-webserver
			livereload: true, // 启用LiveReload
			open: true // 服务器启动时自动打开网页
		}));
	});
	// 监听任务
	gulp.task('watch',function(){
		// 监听 html
		gulp.watch( srcPath.html+'/**/*.html' , ['html'])
		// 监听 css
		gulp.watch( srcPath.css+'/*.css' , ['css'])
        // 监听 less
		gulp.watch( srcPath.less+'/*.less' , ['less'])
		// 监听 images
		gulp.watch( srcPath.image+'/**/*' , ['images']);
		// 监听 js
		gulp.watch( [srcPath.script+'/*.js','!'+srcPath.script+'/*.min.js'] , ['script']);
	});
	// 默认任务
	gulp.task('default',['webserver','watch']);

/* = 发布环境( Release Task )
-------------------------------------------------------------- */
	// 清理文件
	gulp.task('clean', function() {
		return gulp.src( [destPath.css+'/maps',destPath.script+'/maps'], {read: false} ) // 清理maps文件
			.pipe(clean());
	});
	// 样式处理
	gulp.task('lessRelease', function () {
		return sass( srcPath.less, { style: 'compressed' }) // 指明源文件路径、并进行文件匹配（编译风格：压缩）
			.on('error', function (err) {
				console.error('Error!', err.message); // 显示错误信息
			})
			.pipe(gulp.dest( destPath.css )); // 输出路径
	});
	// 脚本压缩&重命名
	gulp.task('scriptRelease', function() {
		return gulp.src( [srcPath.script+'/*.js','!'+srcPath.script+'/*.min.js'] ) // 指明源文件路径、并进行文件匹配，排除 .min.js 后缀的文件
			.pipe(rename({ suffix: '.min' })) // 重命名
			.pipe(uglify()) // 使用uglify进行压缩，并保留部分注释
			.pipe(gulp.dest( destPath.script )); // 输出路径
	});
	// 打包发布
	gulp.task('release', ['clean'], function(){ // 开始任务前会先执行[clean]任务
		return gulp.start('lessRelease','scriptRelease','images'); // 等[clean]任务执行完毕后再执行其他任务
	});