{{-- Fields for adding or editing a downloadable version. Expects $version (or null). --}}
<div class="box-body">
    <div class="row">
        <div class="form-group col-sm-6">
            <label for="version_name" class="control-label">Name</label>
            <input id="version_name" type="text" name="name" class="form-control" value="{{ old('name', $version?->name) }}" placeholder="1.21.4" maxlength="191">
        </div>
        <div class="form-group col-sm-6">
            <label for="version_filename" class="control-label">Save as</label>
            <input id="version_filename" type="text" name="filename" class="form-control" value="{{ old('filename', $version?->filename ?? 'server.jar') }}" maxlength="191">
            <p class="text-muted small">File name in the server's top folder. Must match the egg's startup jar, usually <code>server.jar</code>.</p>
        </div>
    </div>
    <div class="form-group">
        <label for="version_url" class="control-label">Download link</label>
        <input id="version_url" type="url" name="download_url" class="form-control" value="{{ old('download_url', $version?->download_url) }}" placeholder="https://example.com/server-1.21.4.jar">
        <p class="text-muted small">A direct link to the file. Wings downloads it, so the node must be able to reach it.</p>
    </div>
    @if($version)
        <div class="form-group">
            <label for="version_sort" class="control-label">Order</label>
            <input id="version_sort" type="number" min="0" name="sort" class="form-control" value="{{ old('sort', $version->sort) }}">
        </div>
    @endif
    <div class="form-group no-margin-bottom">
        <input type="hidden" name="extract" value="0">
        <div class="checkbox checkbox-primary no-margin-bottom">
            <input id="version_extract" type="checkbox" name="extract" value="1" @checked(old('extract', $version?->extract))>
            <label for="version_extract">The link is an archive; extract it into the server folder</label>
        </div>
    </div>
</div>
