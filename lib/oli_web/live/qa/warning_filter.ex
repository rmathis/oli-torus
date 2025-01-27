defmodule OliWeb.Qa.WarningFilter do
  use Phoenix.LiveComponent

  def render(assigns) do
    ~H"""
    <div class="m-2">
      <div class="flex flex-row items-center">
        <input class="warning-filter" id={"filter-#{@type}"}
          phx-click="filter" phx-value-type={"#{@type}"}
          {if @active do [checked: true] else [] end}
          type="checkbox"
          style="width: 20px; height: 20px;"
          aria-label={"Checkbox for #{@type}"}>
        <label for={"filter-#{@type}"} class="flex flex-row align-items-center ml-2">
          <%= String.capitalize(@type) %>
          <span class="badge badge-info ml-2"><%= length(@warnings) %></span>
        </label>
      </div>
    </div>
    """
  end
end
