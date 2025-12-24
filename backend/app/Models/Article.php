<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'source',
        'source_url',
        'title',
        'content_html',
        'status',
        'rewritten_from_id',
        'references',
    ];

    protected $casts = [
        'references' => 'array',
    ];
}
