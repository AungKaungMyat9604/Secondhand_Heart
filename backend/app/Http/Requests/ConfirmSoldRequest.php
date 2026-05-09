<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmSoldRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'sold' => ['required', 'boolean'],
        ];
    }
}

