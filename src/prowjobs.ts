import axios from 'axios';
axios.defaults.timeout = 3000;
import * as vscode from 'vscode';

export class ProwJobs {
    private _serverUrl: string = '';
    private _focusedJobs: Set<string> = new Set();
    private _focusedRepos: Set<string> = new Set();

    constructor () {
        //this._context = context;
    }

    getConfigurations() {
        this._serverUrl = vscode.workspace.getConfiguration().get('prowjobs.serverUrl') || '';
        if (this._serverUrl[-1] == '/') {
            this._serverUrl = this._serverUrl.slice(0, -1)
        }

        let focusedJobs: string[] = vscode.workspace.getConfiguration().get('prowjobs.focusedJobs') || [];
        focusedJobs = focusedJobs.map(item => item.trim())
        this._focusedJobs = new Set(focusedJobs)

        let focusedRepos: string[] = vscode.workspace.getConfiguration().get('prowjobs.focusedRepos') || [];
        focusedRepos = focusedRepos.map(item => item.trim())
        this._focusedRepos = new Set(focusedRepos)
    }

    async getLatestJobsStatus(): Promise<[Map<string, any>, Map<string, any>, Map<string, any>, Map<string, any>, Map<string, any>]> {
        console.log('[' + new Date().toUTCString() + '] ' + 'Begin to get prow job status.')
        this.getConfigurations();
        let valid = /^(http|https):\/\/[^ "]+$/.test(this._serverUrl);
        if (valid == false) {
            // vscode.window.showErrorMessage('Invalid deck server address: ' + this._serverUrl);
            return [new Map, new Map, new Map, new Map, new Map];
        }
        let uri = `${this._serverUrl}/prowjobs.js?var=allBuilds&omit=annotations,labels,decoration_config,pod_spec`;

        let presubmitTree = new Map;
        let presubmitPRViewTree = new Map;
        let periodicTree = new Map;
        let postsubmitTree = new Map;
        let allFocusedProwJobs = new Map;
        try {
            const res = await axios.get(uri, )
            let body: string = res.data.toString()
            let indexOfBrace = body.indexOf('{')
            let prowjobsStr = body.slice(indexOfBrace, -1)
            let prowjobs: any[] = JSON.parse(prowjobsStr)?.items
            
            let total = prowjobs.length
            console.log('[' + new Date().toUTCString() + '] ' + 'Total prow jobs: ' + total)
            
            for ( let i=0; i < prowjobs.length; i++ ) {
                let pj = prowjobs[i];
                let repo: string;
                if (pj.spec?.extra_refs == undefined && pj.spec?.refs == undefined) {
                    continue;
                }
                if (pj.spec?.type == 'periodic') {
                    repo = pj.spec?.extra_refs[0].org + '/' + pj.spec?.extra_refs[0].repo;
                } else {
                    repo = pj.spec?.refs?.org + '/' +  pj.spec?.refs?.repo;
                }

                if (this._focusedJobs.has(pj.spec?.job) || this._focusedRepos.has(repo) == true) {
                    // metadata.name
                    let uniqueName = pj.metadata?.name || '';
                    // use uid+state as key
                    allFocusedProwJobs.set(uniqueName+pj.status?.state, pj);

                    // job name
                    let jobName = pj.spec?.job;

                    switch (pj.spec?.type) {
                        case 'presubmit': {
                            const prNum = pj.spec?.refs?.pulls[0].number;

                            // job view
                            if (presubmitTree.has(repo)) {
                                let reposDict: Map<string, any> = presubmitTree.get(repo);
                                if (reposDict.has(jobName)) {
                                    let jobsDict: Map<string, any> = reposDict.get(jobName);
                                    if (jobsDict.has(prNum)) {
                                        continue 
                                    } else {
                                        jobsDict.set(prNum, pj);
                                    }
                                } else {
                                    let jobsDict = new Map;
                                    jobsDict.set(prNum, pj);
                                    reposDict.set(jobName, jobsDict);
                                }
                            } else {
                                let reposDict = new Map;
                                let jobsDict = new Map;
                                jobsDict.set(prNum, pj);
                                reposDict.set(jobName, jobsDict);
                                presubmitTree.set(repo, reposDict);
                            }

                            // pr view
                            if (presubmitPRViewTree.has(repo)) {
                                let reposDict: Map<string, any> = presubmitPRViewTree.get(repo);
                                if (reposDict.has(prNum)) {
                                    let prsDict: Map<string, any> = reposDict.get(prNum);
                                    if (prsDict.has(jobName)) {
                                        continue
                                    } else {
                                        prsDict.set(jobName, pj)
                                    }
                                } else {
                                    let prsDict = new Map;
                                    prsDict.set(jobName, pj);
                                    reposDict.set(prNum, prsDict);
                                }
                            } else {
                                let reposDict = new Map;
                                let prsDict = new Map;
                                prsDict.set(jobName, pj);
                                reposDict.set(prNum, prsDict);
                                presubmitPRViewTree.set(repo, reposDict);
                            }
                            break;
                        }

                        case 'postsubmit': {
                            if (postsubmitTree.has(repo)) {
                                let reposDict: Map<string, any> = postsubmitTree.get(repo)
                                if (reposDict.has(jobName)) {
                                    let jobsArr: Array<any> = reposDict.get(jobName)
                                    jobsArr.push(pj);
                                } else {
                                    reposDict.set(jobName, [pj])
                                }
                            } else {
                                let reposDict = new Map;
                                reposDict.set(jobName, [pj])
                                postsubmitTree.set(repo, reposDict); 
                            }
                            break;
                        }

                        case 'periodic': {
                            
                            if (periodicTree.has(repo)) {
                                let reposDict: Map<string, any> = periodicTree.get(repo)
                                if (reposDict.has(jobName)) {
                                    let jobsArr: Array<any> = reposDict.get(jobName)
                                    jobsArr.push(pj);
                                } else {
                                    reposDict.set(jobName, [pj])
                                }
                            } else {
                                let reposDict = new Map;
                                reposDict.set(jobName, [pj])
                                periodicTree.set(repo, reposDict); 
                            }
                            break;
                        }
                    }
                }                    
            };
        } catch(err) {
            console.error(err)
        }
        return [presubmitTree, presubmitPRViewTree, postsubmitTree, periodicTree, allFocusedProwJobs]
    }
}

export enum ProwJobState {
    SUCCESS = 'success',
    PENDING = 'pending',
    FAILED = 'failed',
    ERROR = 'error',
    ABORTED = 'aborted'
}