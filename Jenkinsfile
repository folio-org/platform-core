@Library ('folio_jenkins_shared_libs') _

pipeline {


  environment {
    origin = 'platform-core'
    branch = 'snapshot'
    npmConfig = 'jenkins-npm-folioci'
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
        script {
          currentBuild.displayName = "#${env.BUILD_NUMBER}-${env.JOB_BASE_NAME}"
        }
        sendNotifications 'STARTED'
      }
    }

    stage('Build Stripes Platform') {
      steps {
        // remove existing yarn.lock
        sh 'rm -f yarn.lock'
        sh 'yarn install'
        sh 'yarn build ./output'
      }
    }

    // If stripes build is successful, update yarn.lock and commit
    stage('Commit yarn.lock') {
      when { 
        anyOf {
          environment name:  'JOB_NAME', value: 'Automation/build-platform-core-snapshot'
          branch 'snapshot'
        }
      }
      steps {
        sh "git checkout $env.branch"
        sh 'git add yarn.lock'
        script { 
          def commitStatus = sh(returnStatus: true, 
                                script: 'git commit -m "FOLIO CI: Update yarn.lock"')
          if ( commitStatus == 0 ) {
            sshGitPush(origin: env.origin, branch: env.branch)
          }
          else {
            echo "No changes to yarn.lock file"
          }

        }
      }
    }

    stage('Publish Snapshot NPM') {
      when {
        buildingTag()
      }
      steps {
        // clean up any generated stuff from CI
        sh 'rm -rf bundle output artifacts ci node_modules yarn.lock ModuleDescriptors'

        withCredentials([string(credentialsId: env.npmConfig,variable: 'NPM_TOKEN')]) {
          withNPM(npmrcConfig: env.npmConfig) {
            sh 'npm publish'
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

