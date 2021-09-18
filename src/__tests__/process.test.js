/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {spawn} from 'child_process';
import {createProcess} from '../Process';

jest.mock('child_process');

describe('createProcess', () => {
  let mockConsoleLog;
  beforeEach(() => {
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.resetAllMocks();
    mockConsoleLog.mockRestore();
  });

  it('spawns the process', () => {
    const workspace: any = {jestCommandLine: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn).toBeCalled();
  });

  it('spawns the command from workspace.jestCommandLine', () => {
    const workspace: any = {jestCommandLine: 'jest'};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toBe('jest');
    expect(spawn.mock.calls[0][1]).toEqual([]);
  });

  it('spawns a command with spaces from workspace.jestCommandLine', () => {
    const workspace: any = {jestCommandLine: 'npm test --'};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toBe('npm test --');
  });

  it('appends args', () => {
    const workspace: any = {jestCommandLine: 'npm test --'};
    const args = ['--option', 'value', '--another'];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toEqual(['npm', 'test', '--', ...args].join(' '));
  });

  it('sets the --config arg to workspace.pathToConfig', () => {
    const workspace: any = {
      pathToConfig: 'non-standard.jest.js',
      jestCommandLine: 'npm test --',
    };
    const args = ['--option', 'value'];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toEqual('npm test -- --option value --config non-standard.jest.js');
  });

  it('does not defines the "CI" environment variable', () => {
    const expected = process.env;

    const workspace: any = {jestCommandLine: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].env).toEqual(expected);
  });
  it('allow customize node environment variable', () => {
    const workspace: any = {
      nodeEnv: {NODE_ENV: 'test'},
    };
    const expected = Object.assign({}, process.env, workspace.nodeEnv);
    createProcess(workspace, []);

    expect(spawn.mock.calls[0][2].env).toEqual(expected);
  });
  it.each`
    shell               | expected
    ${undefined}        | ${true}
    ${false}            | ${true}
    ${''}               | ${true}
    ${'powerShell.exe'} | ${'powerShell.exe'}
    ${'/bin/bash'}      | ${'/bin/bash'}
  `('allow customize shell: $shell', ({shell, expected}) => {
    const workspace: any = {
      shell,
    };
    createProcess(workspace, []);

    expect(spawn.mock.calls[0][2].shell).toEqual(expected);
  });

  it('sets the current working directory of the child process', () => {
    const workspace: any = {
      jestCommandLine: '',
      rootPath: 'root directory',
    };
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].cwd).toBe(workspace.rootPath);
  });

  it('should set the "shell" property', () => {
    const expected = true;
    const workspace: any = {jestCommandLine: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].shell).toBe(expected);
  });

  it('should set "detached" to true for non-windows system', () => {
    const workspace: any = {jestCommandLine: ''};
    const args = [];

    const savedProcess = process;
    const processMock = {...process};
    global.process = processMock;

    processMock.platform = 'darwin';
    createProcess(workspace, args);
    expect(spawn.mock.calls[0][2].detached).toBe(true);

    processMock.platform = 'win32';
    createProcess(workspace, args);
    expect(spawn.mock.calls[1][2].detached).toBe(false);

    global.process = savedProcess;
  });
  it('in debug mode, it will log spawn message', () => {
    const workspace: any = {rootPath: 'abc', debug: true};
    const args = [];

    createProcess(workspace, args);
    expect(spawn).toBeCalled();
    expect(mockConsoleLog).toHaveBeenCalled();
  });
});
