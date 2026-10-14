<?php

namespace Pterodactyl\Addons\VersionChanger\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $type
 * @property array $eggs
 * @property int $sort
 * @property \Illuminate\Database\Eloquent\Collection|VersionEntry[] $versions
 */
class VersionGroup extends Model
{
    public const TYPE_DOWNLOAD = 'download';
    public const TYPE_EGG = 'egg';

    public const TYPES = [
        self::TYPE_DOWNLOAD => 'Download a file',
        self::TYPE_EGG => 'Switch egg',
    ];

    protected $table = 'version_changer_groups';

    protected $fillable = ['name', 'type', 'eggs', 'sort'];

    protected $casts = ['eggs' => 'array', 'sort' => 'integer'];

    public function versions(): HasMany
    {
        return $this->hasMany(VersionEntry::class, 'group_id')->orderBy('sort')->orderBy('id');
    }

    /**
     * Egg ids as integers, whatever was stored.
     */
    public function eggIds(): array
    {
        return array_values(array_map('intval', $this->eggs ?? []));
    }

    public function isDownload(): bool
    {
        return $this->type === self::TYPE_DOWNLOAD;
    }
}
