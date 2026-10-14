{{-- Multi-select of eggs grouped by nest. Expects $eggs and $selected (array of ids). --}}
<select id="{{ $id ?? 'eggs' }}" name="eggs[]" class="form-control vc-eggs" multiple>
    @foreach($eggs->groupBy(fn ($egg) => $egg->nest->name ?? 'Other') as $nest => $nestEggs)
        <optgroup label="{{ $nest }}">
            @foreach($nestEggs as $egg)
                <option value="{{ $egg->id }}" @selected(in_array($egg->id, array_map('intval', $selected)))>{{ $egg->name }}</option>
            @endforeach
        </optgroup>
    @endforeach
</select>
