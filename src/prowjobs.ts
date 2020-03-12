import * as superagent from 'superagent';
import * as vscode from 'vscode';

export class ProwJobs {
    private _enable: boolean = true;
    private _turnOnNotification: boolean = true;
    private _serverUrl: string = '';
    private _focusedJobs: Set<string> = new Set();
    private _context: vscode.ExtensionContext;

    constructor (context : vscode.ExtensionContext) {
        this._context = context;
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
        if (this._enable == false) {
            console.log("Extension is turned off.")
            return
        }

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
                
                prowjobs.forEach(pj => {
                    if (this._focusedJobs.has(pj.spec?.job)) {
                        console.log(`${pj.spec.job} ${pj.status.state}`)
                        vscode.window.showErrorMessage(`${pj.spec.job} ${pj.status.state} ${pj.status.startTime}`)
                    }
                });

            });
    }
}