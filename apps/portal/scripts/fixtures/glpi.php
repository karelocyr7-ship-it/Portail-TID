<?php
// Isolated, disposable GLPI only. Never run against a real installation.
require '/var/www/glpi/vendor/autoload.php';
$kernel = new \Glpi\Kernel\Kernel(); $kernel->boot();
global $DB;
if (getenv('GLPI_DB_NAME') !== 'glpi_fixture') { throw new RuntimeException('Fixture database required'); }
Config::setConfigurationValues('core', ['enable_api' => 1, 'enable_api_login_credentials' => 0, 'enable_api_login_external_token' => 1]);
// Public fixture tokens, confined to the isolated test network.
$DB->update('glpi_users', ['api_token' => (new \GLPIKey())->encrypt('synthetic-fixture-user-token')], ['id' => 2]);
if (!$DB->request(['FROM' => 'glpi_apiclients', 'WHERE' => ['name' => 'Synthetic fixture API']])->count()) {
    $DB->insert('glpi_apiclients', ['name' => 'Synthetic fixture API']);
}
$DB->update('glpi_apiclients', ['is_active' => 1, 'app_token' => (new \GLPIKey())->encrypt('synthetic-fixture-app-token')], ['name' => 'Synthetic fixture API']);
echo "Isolated API fixture configured\n";
