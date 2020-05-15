defmodule Oli.Rendering.Activity.ActivitySummary do
  @moduledoc """
  Defines the struct that contains necessary activity data used by the activity renderer.
  These ActivitySummary structs are given to the renderer via the rendering context as
  a map of activity ids to ActivitySummary called activity_map
  """

  @enforce_keys [
    :id,
    :script,
    :state,
    :model,
    :delivery_element,
    :graded
  ]
  defstruct [
    :id,                # id of the activity
    :script,            # path to the script
    :state,             # already encoded json of the state of the attempt
    :model,             # already encoded json of the model of the activity
    :delivery_element,  # the webcomponent element
    :graded             # whether or not the activity is rendering in a graded context
  ]

end
