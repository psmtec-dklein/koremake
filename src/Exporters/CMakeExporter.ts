import {Exporter} from './Exporter';
import {GraphicsApi} from '../GraphicsApi';
import {Options} from '../Options';
import {Platform} from '../Platform';
import {Project} from '../Project';
import * as fs from 'fs';
import * as path from 'path';

export class CMakeExporter extends Exporter {
	constructor() {
		super();
	}

	forProject(name: string, instruction: string): string {
		return instruction.replace('_PID_', name);
	}

	exportSolution(project: Project, from: string, to: string, platform: string) {
		let pn = project.getName();

		this.writeFile(path.resolve(to, 'CMakeLists.txt'));

		// TODO (DK)
			// debug / release / profiling / ... variants
			// precompiled headers
			// map all other missing options

		// TODO (DK) 3.5 is my version, not sure how low we can go here
		this.p('cmake_minimum_required(VERSION 3.5)');
		this.p('project(' + pn + ')');

		let sources: any[] = [];

		for (let file of project.getFiles()) {
			var sfn = file.file.toLowerCase();

			if (sfn.endsWith('.cpp') || sfn.endsWith('.cc') || sfn.endsWith('.c') || sfn.endsWith('.cxx')) {
				sources.push(file.file);
			}
		}

		let executableTag = ' '; // (DK) https://cmake.org/cmake/help/v3.0/command/add_executable.html
				
		switch (platform) {
			case Platform.Windows: executableTag = ' WIN32 '; break;
			case Platform.OSX: executableTag = ' MACOSX_BUNDLE '; break;
		}

		this.p('add_executable(' + pn + executableTag + sources.join(' ') + ')');

		for (let inc of project.getIncludeDirs()) {
			// (DK) it seems cmake requires forward slashes even on windows
			this.p(this.forProject(pn, 'target_include_directories(_PID_ PRIVATE ' + path.resolve(from, inc).replace(/\\/g, '/') + ')'));
		}
		
// compiler options
		if (project.cpp11) {
			// TODO (DK) use features, dont add c++11:  http://de.slideshare.net/DanielPfeifer1/cmake-48475415 page 40
		    this.p(this.forProject(pn, 'if (CMAKE_COMPILER_IS_GNUCXX) target_compile_options(_PID_ PRIVATE -std=c++11) endif()'));
		}
		
// target specific defines
		// TODO (DK) this will get compilicated for stuff like mingw on windows?
		switch (platform) {
			case Platform.Windows: {
			    this.p(this.forProject(pn, 'target_compile_definitions(_PID_ PRIVATE -D_WINSOCK_DEPRECATED_NO_WARNINGS -DWIN32 -D_WINDOWS)'));
			    this.p(this.forProject(pn, 'target_compile_definitions(_PID_ PRIVATE -DUNICODE -D_UNICODE)'));				
			} break;
		}
		
// defines
		for (let def of project.getDefines()) {
			this.p(this.forProject(pn, 'target_compile_definitions(_PID_ PRIVATE -D' + def.replace(/\"/g, "\\\"") + ')'));
		}

// libraries to link
		for (let lib of project.getLibs()) {
			this.p(this.forProject(pn, 'target_link_libraries(_PID_ ' + lib + ')'));
		}

// platform specific libraries to link
		switch (platform) {
			case Platform.Linux: {
				this.p(this.forProject(pn, 'target_link_libraries(_PID_ pthread)'));
			} break;
		}

		this.closeFile();
	}
}
