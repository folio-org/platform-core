@Library ('folio_jenkins_shared_libs') _

pipeline {

  environment {
    folioPlatform = 'platform-core'
    npmConfig = 'jenkins-npm-folio'
    sshKeyId = '11657186-f4d4-4099-ab72-2a32e023cced'
    folioRegistry = 'http://folio-registry.aws.indexdata.com'
    releaseOnly = 'true'
    projUrl = "https://github.com/folio-org/${env.folioPlatform}"
  }

  options {
    timeout(30)
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  agent {
    node {
      label 'jenkins-slave-all'
    }
  }

  stages {
    stage('Setup') {
      steps {
        sendNotifications 'STARTED'
        script {
          currentBuild.displayName = "#${env.BUILD_NUMBER}-${env.JOB_BASE_NAME}"
          // These two variable are set by Github Branch Source plugin
          echo "Origin branch: $env.CHANGE_BRANCH"
          echo "Target branch: $env.CHANGE_TARGET"

          def lastCommit = sh(returnStatus: true,
                              script: "git log -1 | grep '.*\\[CI SKIP\\].*'")
          if (lastCommit == 0) { 
              echo "CI SKIP detected.  Aborting build" 
              env.skipBuild = 'true'
          }
        }
      }
    }

    stage('Do Build') {
      when { 
        expression {
          env.skipBuild != 'true'
        }
      }
      stages {
        stage('Build Stripes Platform') {
          when { 
            not {
              branch 'master'
            }
          }
          steps {
            script {
              if (fileExists('.pr-custom-deps.json')) {
                env.okapiUrl = 'https://okapi-preview.ci.folio.org'
              }
              else {
                env.okapiUrl = 'https://okapi-default.ci.folio.org'
              }
  
              if (env.CHANGE_ID) { 
                def tenant = "${env.folioPlatform}_${env.CHANGE_ID}_${env.BUILD_NUMBER}"
                def foliociLib = new org.folio.foliociCommands()
                env.tenant = foliociLib.replaceHyphen(tenant)
              }
              else { 
                env.tenant = 'diku'
              }
            }

            echo "Okapi URL: ${env.okapiUrl}"
            echo "Tenant: ${env.tenant}"

            buildStripesPlatform(env.okapiUrl,env.tenant)
          }
        }

        stage('Check Platform Dependencies') {
          when {
            not {
              branch 'master'
            }
          }
          steps {
            script {
              def foliociLib = new org.folio.foliociCommands()

              // Deal with PR Deps for preview mode
              if (fileExists('.pr-custom-deps.json'))  {
                def previewMods = readJSON file: '.pr-custom-deps.json'

                // update okapi-install.json
                def okapiInstall = readJSON file: 'okapi-install.json'
                def newOkapiInstall = foliociLib.subPreviewMods(previewMods,okapiInstall)
                writeJSON file: 'okapi-install.json', json: newOkapiInstall, pretty: 2
                sh 'cat okapi-install.json'
              }
              else {
                // Add extra backend deps
                echo "Creating okapi preseed module list"
                sh 'jq -s \'.[0]=([.[]]|flatten)|.[0]\' stripes-install.json install-extras.json > install-pre.json'
                def installPreJson = readFile('./install-pre.json')
                platformDepCheck(env.tenant,installPreJson)
                echo 'Generating backend dependency list to okapi-install.json'
                sh 'jq \'map(select(.id | test(\"mod-\"; \"i\")))\' install.json > okapi-install.json'
                sh 'cat okapi-install.json'
                sh 'mv stripes-install.json stripes-install-pre.json'
                sh 'jq \'map(select(.id | test(\"edge-\"; \"i\")))\' install.json > install-edge.json'
                sh 'jq -s \'.[0]=([.[]]|flatten)|.[0]\' stripes-install-pre.json install-edge.json > stripes-install.json'
                sh 'cat stripes-install.json'
              }
            }
            // archive install.json
            sh 'mkdir -p ci'
            sh 'cp install.json ci'
            publishHTML([allowMissing: false, alwaysLinkToLastBuild: false,
                         keepAll: true, reportDir: 'ci',
                         reportFiles: 'install.json',
                         reportName: "install.json",
                         reportTitles: "install.json"])
          }
        }

/*
 *       stage('Deploy Tenant') {
 *         when {
 *           changeRequest()
 *         }
 *         steps {
 *           // set up preview environment
 *           script {
 *             if (fileExists('.pr-custom-deps.json')) {
 *               setupPreviewEnv()
 *             }
 *           }
 *
 *           // Enable tenant
 *           deployTenantK8()
 *
 *           script { 
 *             // Deploy tenant bundle to S3
 *             withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
 *                               accessKeyVariable: 'AWS_ACCESS_KEY_ID',
 *                               credentialsId: 'jenkins-aws',
 *                               secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
 *
 *               def s3Opts = [ s3Bucket: "${env.folioPlatform}-${env.CHANGE_ID}",
 *                              s3Tags: "Key=Pr,Value=${env.folioPlatform}-${env.CHANGE_ID}",
 *                              srcPath: "${env.WORKSPACE}/output" ]
 *                  
 *               def s3Endpoint = s3Upload(s3Opts)
 *               env.folioUrl = s3Endpoint + '/index.html'
 *             }
 *           
 *             def githubSummary = "Bundle deployed for tenant,${tenant}," + 
 *                                 "to ${env.folioUrl}" 
 *             @NonCPS
 *             def comment = pullRequest.comment(githubSummary)
 *           }
 *         }
 *       }
 */

/*
 *       stage('Run Integration Tests') {
 *         when {
 *           changeRequest()
 *         }
 *         steps {
 *           script {
 *             def testOpts = [ tenant: env.tenant,
 *                              folioUrl: env.folioUrl,
 *                              okapiUrl: env.okapiUrl,
 *                              folioUser: env.tenant + '_admin',
 *                              folioPassword: 'admin']
 *
 *             def testStatus = runIntegrationTests(testOpts)
 *
 *              if (testStatus == 'FAILED') { 
 *               error('UI Integration test failures')
 *             }
 *           }
 *         }
 *       }
 */

        stage('Publish NPM Package') {
          when {
            buildingTag()
          }
          steps {
            withCredentials([string(credentialsId: 'jenkins-npm-folioci',variable: 'NPM_TOKEN')]) {
              withNPM(npmrcConfig: env.npmConfig) {
                // clean up generated artifacts before publishing
                sh 'rm -rf ci artifacts bundle node_modules'
                // don't include these in package
                sh 'rm -rf yarn.lock install.json stripes-install.json okapi-install.json'
                sh 'npm publish'
              }
            }
          }
        }

        stage('Update Branch Install Artifacts') {
          // Update branch with install artifacts
          when {
            changeRequest()
          }
          steps {
            script {


              def installFiles = ['stripes-install.json',
                                  'okapi-install.json',
                                  'install.json',
                                  'yarn.lock']

              sh "git fetch --no-tags ${env.projUrl} " +
                 "+refs/heads/${env.CHANGE_BRANCH}:refs/remotes/origin/${env.CHANGE_BRANCH}"
              sh "git checkout -b ${env.CHANGE_BRANCH} origin/${env.CHANGE_BRANCH}"

              for (int i = 0; i < installFiles.size(); i++) {
                sh "git add ${env.WORKSPACE}/${installFiles[i]}"
              }

              commitStatus = sh(returnStatus: true,
                                    script: 'git commit -m "[CI SKIP] Updating install files on branch"')
              if (commitStatus == 0) {
                sshGitPush(origin: env.folioPlatform, branch: env.CHANGE_BRANCH)
              }
              else {
                echo "No new changes.  No push to git origin needed" 
              }
            }
          }
        }
      } // end 'do build' stage
    } // end inner stages
  } // end outter stages

  post {
    always {
      sendNotifications currentBuild.result
    }
  }
}
