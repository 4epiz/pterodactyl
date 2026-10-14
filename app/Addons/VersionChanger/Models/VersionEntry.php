<?php

namespace Pterodactyl\Addons\VersionChanger\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A downloadable version in a "download" group.
 *
 * @property int $id
 * @property int $group_id
 * @property string $name
 * @property string $download_url
 * @property string $filename
 * @property bool $extract
 * @property int $sort
 */
class VersionEntry extends Model
{
    protected $table = 'version_changer_versions';

    protected $fillable = ['group_id', 'name', 'download_url', 'filename', 'extract', 'sort'];

    protected $casts = ['extract' => 'boolean', 'sort' => 'integer', 'group_id' => 'integer'];

    public function group(): BelongsTo
    {
        return $this->belongsTo(VersionGroup::class, 'group_id');
    }
}
