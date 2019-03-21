@Library ('folio_jenkins_shared_libs@FOLIO-1738') _

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
        }
      }
    }

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
          anyOf { 
            changeRequest()
            branch 'master'
          }
        }
      }  
      steps {
        script {
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

    stage('Build FOLIO Instance') {
      when {
        changeRequest()
      }
      steps {
        // build FOLIO instance
        buildPlatformInstance(env.ec2Group,env.folioHostname,env.tenant)
      }
    }

    stage('Run Integration Tests') {
      when {
        changeRequest()
      }
      steps {
        script {
          def testOpts = [ tenant: env.tenant,
                           folioUrl: env.folioUrl,
                           okapiUrl: env.okapiUrl,
                           folioUser: env.tenant + '_admin',
                           folioPassword: 'admin']

          def testStatus = runIntegrationTests(testOpts)

          if (testStatus == 'FAILED') { 
            error('UI Integration test failures')
          }
        }
      }
    }

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
            sh 'rm -rf yarn.lock stripes-install.json okapi-install.json'
            sh 'npm publish'
          }
        }
      }
    }

    stage('Update Branch Install Artifacts') {
      // Update branch with install artifacts
      when {
        not { 
          anyOf {
            branch 'master'
            changeRequest()
          }
        }
      } 
      steps {
        script {
          sh "git checkout $env.BRANCH_NAME"

          // determine if we should skip a git commit by searching 
          // for [CI SKIP] in the previous commit in order to prevent
          // possible build loops. 

          def lastCommit = sh(returnStatus: true,
                              script: "git log -1 | grep '.*\\[CI SKIP\\].*'")
          if (lastCommit == 0) { 
              echo "CI SKIP detected.  No push to git origin needed" 
          }
          else {
            sh "git add ${env.WORKSPACE}/stripes-install.json"
            sh "git add ${env.WORKSPACE}/okapi-install.json"
            sh "git add ${env.WORKSPACE}/yarn.lock"

            def commitStatus = sh(returnStatus: true,
                                script: 'git commit -m "[CI SKIP] Updating install files"')
            if (commitStatus == 0) {
              sshGitPush(origin: env.folioPlatform, branch: env.BRANCH_NAME)
            }
            else {
              echo "No new changes.  No push to git origin needed" 
            }
          }
        }
      }
    }

  } // end stages

  post {
    always {
      sendNotifications currentBuild.result
    }
  }
}

