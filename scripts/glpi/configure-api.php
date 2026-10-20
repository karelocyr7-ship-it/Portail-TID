<?php
// Invoked by activate-glpi-api.py. Secrets arrive through stdin, never argv/logs.
$stage = 'bootstrap';
try {
    require '/var/www/glpi/vendor/autoload.php';
    $kernel = new \Glpi\Kernel\Kernel(); $kernel->boot();
    global $DB, $CFG_GLPI;
    $fixture = ($provisioningInput['fixture'] ?? false) === true;
    if ($fixture) {
        if (getenv('GLPI_DB_NAME') !== 'glpi_fixture') throw new RuntimeException();
        $_REQUEST['user_token'] = 'synthetic-fixture-user-token';
        $auth = new Auth(); if (!$auth->login('', '', false, false)) throw new RuntimeException();
    } else {
        if (($CFG_GLPI['url_base'] ?? '') !== 'https://glpi.tadgroupe.com') throw new RuntimeException();
        $access = json_decode(file_get_contents('/var/glpi/config/bootstrap-access.json'), true, 512, JSON_THROW_ON_ERROR);
        $auth = new Auth(); if (!$auth->login($access['username'], $access['password'], true)) throw new RuntimeException();
        unset($access);
    }
    Session::changeProfile(4);
    if (!Session::haveRight('profile', CREATE) || !Session::haveRight('user', CREATE)) throw new RuntimeException();
    $suffix = $fixture ? '-' . $provisioningInput['fixtureId'] : '';
    if ($fixture && !preg_match('/^[a-f0-9]{12}$/', $provisioningInput['fixtureId'])) throw new RuntimeException();
    $serviceName = 'svc-portail-provisioning' . $suffix;
    $profileName = 'Portail - Creation des comptes' . $suffix;
    $clientName = 'Portail GLPI provisioning' . $suffix;
    foreach (['appToken','userToken'] as $key) {
        if (!preg_match('/^[a-f0-9]{64}$/', $provisioningInput[$key] ?? '')) throw new RuntimeException();
    }
    $stage = 'preflight';
    foreach ([['glpi_users','name',$serviceName], ['glpi_profiles','name',$profileName], ['glpi_apiclients','name',$clientName]] as [$table,$column,$value]) {
        if (countElementsInTable($table, [$column=>$value])) throw new RuntimeException();
    }
    $defaultProfile = Profile::getDefault();
    $profile = new Profile(); $profile->getFromDB($defaultProfile);
    if (($profile->fields['interface'] ?? '') !== 'helpdesk') throw new RuntimeException();
    if (!$fixture) {
        Plugin::load('samlsso', true);
        $saml = iterator_to_array($DB->request(['SELECT'=>['sp_nameid_format'],'FROM'=>\GlpiPlugin\Samlsso\Config::getTable(),'WHERE'=>['is_active'=>1,'is_deleted'=>0]]));
        if (count($saml)!==1 || reset($saml)['sp_nameid_format'] !== 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress') throw new RuntimeException();
    }
    $snapshot = function() use ($DB) {
        $result = [];
        foreach ($DB->request(['SELECT'=>['id','name','authtype','auths_id','is_active','is_deleted','registration_number'],'FROM'=>'glpi_users','ORDER'=>'id']) as $row) {
            $row['profiles'] = iterator_to_array($DB->request(['SELECT'=>['profiles_id','entities_id','is_recursive','is_dynamic'],'FROM'=>'glpi_profiles_users','WHERE'=>['users_id'=>$row['id']],'ORDER'=>'id']));
            $result[$row['id']] = hash('sha256', json_encode($row));
        }
        return $result;
    };
    $before = $snapshot();
    $oldApi = Config::getConfigurationValues('core', ['enable_api','enable_api_login_external_token']);
    $DB->beginTransaction();
    $stage = 'profile';
    $id = (new Profile())->add(['name'=>$profileName, 'interface'=>'central', 'is_default'=>0, 'user'=>READ | CREATE, 'comment'=>'Dedicated portal identity provisioning; no update/delete/profile management.']);
    if (!$id) throw new RuntimeException();
    $stage = 'service';
    $userId = (new User())->add(['name'=>$serviceName, 'realname'=>'Portail provisioning service', 'authtype'=>Auth::EXTERNAL, 'is_active'=>1, 'api_token'=>$provisioningInput['userToken'], '_profiles_id'=>$id, '_entities_id'=>0, '_is_recursive'=>1, 'profiles_id'=>$id, 'entities_id'=>0]);
    if (!$userId) throw new RuntimeException();
    $assignments = iterator_to_array($DB->request(['SELECT'=>['profiles_id'],'FROM'=>'glpi_profiles_users','WHERE'=>['users_id'=>$userId]]));
    if (count($assignments)!==1 || (int)reset($assignments)['profiles_id'] !== (int)$id) throw new RuntimeException();
    $stage = 'client';
    $clientId = (new APIClient())->add(['name'=>$clientName,'is_active'=>1,'app_token'=>$provisioningInput['appToken'],'dolog_method'=>0,'comment'=>'Dedicated portal identity provisioning. Token authentication only.']);
    if (!$clientId) throw new RuntimeException();
    $stage = 'enable';
    Config::setConfigurationValues('core', ['enable_api'=>1,'enable_api_login_external_token'=>1]);
    $after = $snapshot();
    foreach ($before as $user => $fingerprint) if (($after[$user] ?? '') !== $fingerprint) throw new RuntimeException();
    $DB->commit();
    echo json_encode(['ok'=>true,'serviceId'=>$userId,'profileId'=>$id,'clientId'=>$clientId,'existingAccountsPreserved'=>count($before),'defaultProfileId'=>$defaultProfile,'previousApi'=>$oldApi], JSON_THROW_ON_ERROR)."\n";
} catch (Throwable $e) {
    if (isset($DB) && $DB->isInTransaction()) $DB->rollBack();
    fwrite(STDERR, 'GLPI provisioning configuration failed at stage: '.$stage."\n"); exit(1);
}
