import * as superagent from 'superagent';
import * as vscode from 'vscode';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

export class ProwJobs {
    private _enable: boolean = true;
    private _turnOnNotification: boolean = true;
    private _serverUrl: string = '';
    private _focusedJobs: Set<string> = new Set();
    //private _context: vscode.ExtensionContext;

    constructor () {
        //this._context = context;
    }

    getConfigurations() {
        this._turnOnNotification = vscode.workspace.getConfiguration().get('prowjobs.turnOnNotification') || true;
        this._serverUrl = vscode.workspace.getConfiguration().get('prowjobs.serverUrl') || '';
        if (this._serverUrl[-1] == '/') {
            this._serverUrl = this._serverUrl.slice(0, -1)
        }

        let focusedJobs: string[] = vscode.workspace.getConfiguration().get('prowjobs.focusedJobs') || [];
        this._focusedJobs = new Set(focusedJobs)

        console.log("Prow notification turn: " + this._turnOnNotification);
        console.log("Prow deck url: " + this._serverUrl);
        console.log("Prow focused jobs: " + this._focusedJobs);
    }

    getLatestJobsStatus() {
        console.log('Begin to get prow job status.')
        this.getConfigurations();
        let valid = /^(http|https):\/\/[^ "]+$/.test(this._serverUrl);
        if (valid == false) {
            vscode.window.showErrorMessage('Invalid deck server address: ' + this._serverUrl);
            return 
        }
        let uri = `${this._serverUrl}/prowjobs.js?var=allBuilds&omit=annotations,labels,decoration_config,pod_spec`;

        superagent
            .get(uri)
            .timeout(4000)
            .end((err, res) => {
                let body: string = res.body.toString()
                let indexOfBrace = body.indexOf('{')
                let prowjobsStr = body.slice(indexOfBrace, -1)
                let prowjobs: any[] = JSON.parse(prowjobsStr)?.items
                
                let total = prowjobs.length
                console.log('Total prow jobs: ' + total)
                
                let presubmitTree = new Map;
                let periodicTree = new Map;
                let postsubmitTree = new Map;
                for ( let i=0; i < prowjobs.length; i++ ) {
                    let pj = prowjobs[i];
                    if (this._focusedJobs.has(pj.spec?.job)) {
                        let jobName = pj.spec?.job;
                        const repo = pj.spec?.refs?.repo;
                        // const state = pj.status?.state;

                        switch (pj.spec?.type) {
                            case 'presubmit': {
                                const prNum = pj.spec?.refs?.pulls[0].number;

                                if (presubmitTree.has(repo)) {
                                    let reposDict: Map<string, any> = presubmitTree.get(repo)
                                    if (reposDict.has(jobName)) {
                                        let jobsDict: Map<string, any> = reposDict.get(jobName)
                                        if (jobsDict.has(prNum)) {
                                            return
                                        } else {
                                            jobsDict.set(prNum, pj)
                                        }
                                    } else {
                                        let jobsDict = new Map;
                                        jobsDict.set(prNum, pj)
                                        reposDict.set(jobName, jobsDict)
                                    }
                                } else {
                                    let reposDict = new Map;
                                    let jobsDict = new Map;
                                    jobsDict.set(prNum, pj)
                                    reposDict.set(jobName, jobsDict)
                                    presubmitTree.set(repo, reposDict)
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
                                    let reposDicts = new Map;
                                    reposDicts.set(jobName, [pj])
                                    periodicTree.set(repo, reposDicts); 
                                }
                                break;
                            }
                        }
                    }                    
                };

            });
    }
}