<?php

namespace Pterodactyl\Addons\VersionChanger\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * The version last installed on a server through the version changer.
 *
 * @property int $server_id
 * @property int|null $group_id
 * @property int|null $version_id
 * @property string $name
 * @property \Carbon\CarbonImmutable $installed_at
 */
class InstalledVersion extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $table = 'version_changer_installs';

    protected $primaryKey = 'server_id';

    protected $fillable = ['server_id', 'group_id', 'version_id', 'name', 'installed_at'];

    protected $casts = ['installed_at' => 'immutable_datetime', 'group_id' => 'integer', 'version_id' => 'integer'];
}
