@Library ('folio_jenkins_shared_libs') _

pipeline {

  environment {
    folioPlatform = 'platform-core'
    folioHostname = "${folioPlatform}-${env.CHANGE_ID}-${env.BUILD_NUMBER}"
    ec2Group = "platform_core_${env.CHANGE_ID}_${env.BUILD_NUMBER}"
    npmConfig = 'jenkins-npm-folio'
    sshKeyId = '11657186-f4d4-4099-ab72-2a32e023cced'
    folioRegistry = 'http://folio-registry.aws.indexdata.com'
    releaseOnly = 'true'
    okapiUrl = "http://${env.folioHostname}.aws.indexdata.com:9130"
    folioUrl = "http://${env.folioHostname}.aws.indexdata.com"
    projUrl = "https://github.com/folio-org/${folioPlatform}"
    tenant = 'diku'
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
          steps {
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
              echo "Adding additional modules to stripes-install.json"
              sh 'mv stripes-install.json stripes-install-pre.json'
              sh 'jq -s \'.[0]=([.[]]|flatten)|.[0]\' stripes-install-pre.json install-extras.json > stripes-install.json'
              def stripesInstallJson = readFile('./stripes-install.json')
              platformDepCheck(env.tenant,stripesInstallJson)
              echo 'Generating backend dependency list to okapi-install.json'
              sh 'jq \'map(select(.id | test(\"mod-\"; \"i\")))\' install.json > okapi-install.json'
              sh 'cat okapi-install.json'
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

        stage('Update Branch Install Artifacts') {
          // Update branch with install artifacts
          when {
            changeRequest()
          }
          steps {
            script {
              sh "git fetch --no-tags ${env.projUrl} +refs/heads/${env.CHANGE_BRANCH}:refs/remotes/origin/${env.CHANGE_BRANCH}"
              sh "git checkout -f $env.CHANGE_BRANCH"
              sh 'git branch'

              sh "git add ${env.WORKSPACE}/stripes-install.json"
              sh "git add ${env.WORKSPACE}/okapi-install.json"
              sh "git add ${env.WORKSPACE}/install.json"
              sh "git add ${env.WORKSPACE}/yarn.lock"

              def commitStatus = sh(returnStatus: true,
                                    script: 'git commit -m "[CI SKIP] Updating install files"')
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

