<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLegalAgreementFieldsToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Terms of Service acceptance
            $table->timestamp('tos_accepted_at')->nullable()->after('email_verified_at');
            $table->string('tos_version', 50)->nullable()->after('tos_accepted_at');
            $table->ipAddress('tos_ip_address')->nullable()->after('tos_version');

            // Privacy Policy acceptance
            $table->timestamp('privacy_accepted_at')->nullable()->after('tos_ip_address');
            $table->string('privacy_version', 50)->nullable()->after('privacy_accepted_at');

            // Photo ownership certification
            $table->boolean('photo_ownership_certified')->default(false)->after('privacy_version');
            $table->timestamp('photo_cert_accepted_at')->nullable()->after('photo_ownership_certified');

            // Photographer permission certification
            $table->boolean('photographer_permission_certified')->default(false)->after('photo_cert_accepted_at');
            $table->timestamp('photographer_cert_accepted_at')->nullable()->after('photographer_permission_certified');

            // Fair Housing compliance acknowledgment
            $table->boolean('fair_housing_acknowledged')->default(false)->after('photographer_cert_accepted_at');
            $table->timestamp('fair_housing_acknowledged_at')->nullable()->after('fair_housing_acknowledged');

            // License information for Iowa compliance
            $table->string('license_number', 100)->nullable()->after('fair_housing_acknowledged_at');
            $table->string('office_city', 100)->nullable()->after('license_number');
            $table->string('office_state', 2)->nullable()->after('office_city');
            $table->string('brokerage_name', 255)->nullable()->after('office_state');
            $table->json('licensed_states')->nullable()->after('brokerage_name');

            // Email and SMS marketing consent
            $table->boolean('email_marketing_consent')->default(false)->after('licensed_states');
            $table->timestamp('email_marketing_consent_at')->nullable()->after('email_marketing_consent');
            $table->boolean('sms_marketing_consent')->default(false)->after('email_marketing_consent_at');
            $table->timestamp('sms_marketing_consent_at')->nullable()->after('sms_marketing_consent');
            $table->ipAddress('sms_consent_ip_address')->nullable()->after('sms_marketing_consent_at');

            // DMCA tracking
            $table->integer('dmca_notice_count')->default(0)->after('sms_consent_ip_address');
            $table->timestamp('last_dmca_notice_at')->nullable()->after('dmca_notice_count');
            $table->boolean('dmca_repeat_infringer')->default(false)->after('last_dmca_notice_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'tos_accepted_at',
                'tos_version',
                'tos_ip_address',
                'privacy_accepted_at',
                'privacy_version',
                'photo_ownership_certified',
                'photo_cert_accepted_at',
                'photographer_permission_certified',
                'photographer_cert_accepted_at',
                'fair_housing_acknowledged',
                'fair_housing_acknowledged_at',
                'license_number',
                'office_city',
                'office_state',
                'brokerage_name',
                'licensed_states',
                'email_marketing_consent',
                'email_marketing_consent_at',
                'sms_marketing_consent',
                'sms_marketing_consent_at',
                'sms_consent_ip_address',
                'dmca_notice_count',
                'last_dmca_notice_at',
                'dmca_repeat_infringer',
            ]);
        });
    }
}
