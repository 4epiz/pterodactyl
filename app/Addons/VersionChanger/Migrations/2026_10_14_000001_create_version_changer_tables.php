<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('version_changer_groups', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            // "download": versions are files downloaded into the server folder.
            // "egg": versions are the eggs listed in "eggs"; switching reinstalls the server.
            $table->string('type', 16);
            // Servers using one of these eggs can see the group.
            $table->json('eggs');
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('version_changer_versions', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('group_id');
            $table->string('name');
            $table->text('download_url');
            $table->string('filename');
            $table->boolean('extract')->default(false);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->foreign('group_id')->references('id')->on('version_changer_groups')->cascadeOnDelete();
        });

        Schema::create('version_changer_installs', function (Blueprint $table) {
            $table->unsignedInteger('server_id')->primary();
            $table->unsignedInteger('group_id')->nullable();
            $table->unsignedInteger('version_id')->nullable();
            $table->string('name');
            $table->timestamp('installed_at');

            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
            $table->foreign('group_id')->references('id')->on('version_changer_groups')->nullOnDelete();
            $table->foreign('version_id')->references('id')->on('version_changer_versions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('version_changer_installs');
        Schema::dropIfExists('version_changer_versions');
        Schema::dropIfExists('version_changer_groups');
    }
};
