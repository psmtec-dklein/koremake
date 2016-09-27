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

	exportSolution(project: Project, from: string, to: string, platform: string) {
		var pn = project.getName();

		this.writeFile(path.resolve(to, 'CMakeLists.txt'));

		// TODO (DK)
			// debug / release / ... variants
			// precompiled headers
			// map all other missing options

		// TODO (DK) 3.5 is my version, not sure how low we can go here
		this.p('cmake_minimum_required(VERSION 3.5)');
		this.p('project(' + pn + ')');

		// TODO (DK) for now we just take everything, get a list of sources from koremake instead?
		//this.p('file(GLOB_RECURSE sources Sources/src/*.cpp Sources/src/*.cc Sources/src/*.c)');
		let sources = [];

		for (let file of project.getFiles()) {
			//let dir = if ()
			var sfn = file.file.toLowerCase();

			if (sfn.endsWith('.cpp') || sfn.endsWith('.cc') || sfn.endsWith('.c') || sfn.endsWith('.cxx')) {
				sources.push(file.file);
			}
		}

		let executable = platform == Platform.Windows ? ' WIN32 ' : ' ';

		this.p('add_executable(' + pn + executable + sources.join(' ') + ')');// ${sources})')
		
		if (project.cpp11) {
		    this.p('target_compile_options(' + pn + ' PUBLIC -std=c++11)');
		}
		
		switch (platform) {
			case Platform.Windows: {
				console.log('Setting ' + platform + ' defines.');
				
			    this.p('target_compile_definitions(' + pn + ' PUBLIC -D_WINSOCK_DEPRECATED_NO_WARNINGS -DWIN32 -D_WINDOWS)');
			    this.p('target_compile_definitions(' + pn + ' PRIVATE -DUNICODE -D_UNICODE)');				
			}
			case Platform.Linux: {
				this.p('target_link_libraries(' + pn + ' pthread)');
			}
		}
		
		for (let def of project.getDefines()) {
			this.p('target_compile_options(' + pn + ' PUBLIC -D' + def.replace(/\"/g, "\\\"") + ')');
		}

		for (let inc of project.getIncludeDirs()) {
			// (DK) it seems cmake requires forward slashes even on windows
			this.p('target_include_directories(' + pn + ' PUBLIC ' + path.resolve(from, inc).replace(/\\/g, '/') + ')');
		}

		for (let lib of project.getLibs()) {
			this.p('target_link_libraries(' + pn + ' ' + lib + ')');
		}

		// TODO (DK) map everything else ()

		this.closeFile();
	}
}
