<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreListingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'condition' => ['nullable', 'string', 'max:50'],
            'location_city' => ['required', 'string', 'max:100'],
            'location_region' => ['required', 'string', 'max:100'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'image', 'max:5120'],
            'sale_type' => ['nullable', 'string', 'in:auction,sellings'],
            'price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $saleType = $this->input('sale_type', 'auction');
                $price = $this->input('price');

                if ($saleType === 'sellings' && ($price === null || $price === '')) {
                    $validator->errors()->add('price', 'The price field is required for sellings listings.');
                }

                if ($saleType === 'auction' && ($price !== null && $price !== '')) {
                    $validator->errors()->add('price', 'Price is only allowed for sellings listings.');
                }
            },
        ];
    }
}
