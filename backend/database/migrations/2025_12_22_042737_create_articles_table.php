<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();

            $table->string('source')->default('beyondchats');
            $table->string('source_url')->unique();

            $table->string('title');
            $table->longText('content_html')->nullable();

            $table->enum('status', ['original', 'rewritten'])->default('original');
            $table->foreignId('rewritten_from_id')->nullable()->constrained('articles')->nullOnDelete();

            $table->json('references')->nullable(); // store array of {title,url}
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
